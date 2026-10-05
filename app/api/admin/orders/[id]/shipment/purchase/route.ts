import { NextResponse } from "next/server";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import { purchaseMelhorEnvioSandboxShipment } from "@/src/lib/melhor-envio/shipment";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: Request,
  { params }: RouteProps,
) {
  try {
    /*
     * 1. Somente administradores podem
     * comprar fretes.
     */
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Não autorizado.",
        },
        {
          status: 401,
        },
      );
    }

    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Pedido inválido.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * 2. Confirma que o pedido continua
     * aprovado antes de qualquer operação
     * relacionada à expedição.
     */
    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error(
        "Erro ao consultar pedido para compra do frete:",
        orderError.message,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível consultar o pedido.",
        },
        {
          status: 500,
        },
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Pedido não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    if (order.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Somente pedidos aprovados podem ter o frete comprado.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 3. Carrega os shipments do pedido.
     *
     * Nesta primeira versão controlada,
     * exigimos exatamente um shipment.
     *
     * Isso evita uma compra parcialmente
     * concluída caso futuramente um pedido
     * tenha várias etiquetas independentes.
     */
    const {
      data: shipments,
      error: shipmentsError,
    } = await supabaseAdmin
      .from("order_shipments")
      .select(
        `
          id,
          provider,
          provider_shipment_id,
          status,
          purchased_at
        `,
      )
      .eq("order_id", order.id)
      .eq("provider", "melhor_envio")
      .order("created_at", {
        ascending: true,
      });

    if (shipmentsError) {
      console.error(
        "Erro ao consultar shipment para compra:",
        shipmentsError.message,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível consultar o envio.",
        },
        {
          status: 500,
        },
      );
    }

    if (!shipments || shipments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O pedido ainda não possui um envio preparado.",
        },
        {
          status: 409,
        },
      );
    }

    if (shipments.length !== 1) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Este pedido possui múltiplos envios. A compra automática foi bloqueada para evitar processamento parcial.",
        },
        {
          status: 409,
        },
      );
    }

    const shipment = shipments[0];

    const providerShipmentId =
      String(
        shipment.provider_shipment_id ?? "",
      ).trim();

    if (!providerShipmentId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O envio não possui identificador do Melhor Envio.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 4. Estados que não podem executar
     * novamente o checkout.
     */
    if (
      shipment.status === "purchased" ||
      shipment.status === "generated" ||
      shipment.status === "printed" ||
      shipment.status === "posted" ||
      shipment.status === "in_transit" ||
      shipment.status === "delivered"
    ) {
      return NextResponse.json(
        {
          success: false,
          purchaseExecuted: false,
          shipmentId: shipment.id,
          message:
            "Este envio já passou pela etapa de compra.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Se ficou em purchasing, uma tentativa
     * anterior pode ter chegado ao provedor.
     *
     * Não fazemos retry automático.
     */
    if (shipment.status === "purchasing") {
      return NextResponse.json(
        {
          success: false,
          purchaseExecuted: false,
          needsReconciliation: true,
          shipmentId: shipment.id,
          message:
            "Este envio já possui uma compra em processamento. Não tente comprar novamente automaticamente.",
        },
        {
          status: 409,
        },
      );
    }

    if (shipment.status !== "cart") {
      return NextResponse.json(
        {
          success: false,
          purchaseExecuted: false,
          shipmentId: shipment.id,
          message:
            "O envio não está disponível para compra.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 5. Adquire a trava local.
     *
     * A atualização só funciona se o shipment
     * ainda estiver em "cart".
     *
     * Duas requisições concorrentes:
     *
     * A: cart -> purchasing
     * B: não encontra mais status cart
     *
     * Portanto somente A pode chamar
     * o Melhor Envio.
     */
    const {
      data: claimedShipment,
      error: claimError,
    } = await supabaseAdmin
      .from("order_shipments")
      .update({
        status: "purchasing",
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", shipment.id)
      .eq("provider", "melhor_envio")
      .eq("status", "cart")
      .eq(
        "provider_shipment_id",
        providerShipmentId,
      )
      .select(
        "id, provider_shipment_id, status",
      )
      .maybeSingle();

    if (claimError) {
      console.error(
        "Erro ao reservar compra do frete:",
        claimError.message,
      );

      return NextResponse.json(
        {
          success: false,
          purchaseExecuted: false,
          message:
            "Não foi possível reservar a compra do frete.",
        },
        {
          status: 500,
        },
      );
    }

    if (!claimedShipment) {
      /*
       * Outra requisição pode ter adquirido
       * a trava entre a leitura e o UPDATE.
       */
      return NextResponse.json(
        {
          success: false,
          purchaseExecuted: false,
          needsReconciliation: true,
          shipmentId: shipment.id,
          message:
            "A compra deste envio já foi iniciada por outra requisição.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 6. Somente quem conseguiu mudar
     * cart -> purchasing chega aqui.
     */
    try {
      await purchaseMelhorEnvioSandboxShipment(
        providerShipmentId,
      );
    } catch (providerError) {
      /*
       * Não voltamos para "cart".
       *
       * Uma falha de rede pode acontecer
       * depois de o Melhor Envio receber
       * a requisição. Liberar retry aqui
       * poderia causar compra duplicada.
       */
      console.error(
        "Erro ao comprar envio no Melhor Envio:",
        providerError instanceof Error
          ? providerError.message
          : "Erro desconhecido",
      );

      return NextResponse.json(
        {
          success: false,
          purchaseExecuted: true,
          needsReconciliation: true,
          shipmentId: shipment.id,
          message:
            "A compra foi enviada ao Melhor Envio, mas não foi possível confirmar o resultado. O envio foi mantido em processamento para evitar duplicidade.",
        },
        {
          status: 502,
        },
      );
    }

    /*
     * 7. O Melhor Envio confirmou o checkout.
     * Agora persistimos o estado local.
     */
    const purchasedAt =
      new Date().toISOString();

    const {
      data: purchasedShipment,
      error: purchaseUpdateError,
    } = await supabaseAdmin
      .from("order_shipments")
      .update({
        status: "purchased",
        purchased_at: purchasedAt,
        updated_at: purchasedAt,
      })
      .eq("id", shipment.id)
      .eq("provider", "melhor_envio")
      .eq("status", "purchasing")
      .eq(
        "provider_shipment_id",
        providerShipmentId,
      )
      .select(
        `
          id,
          status,
          provider_shipment_id,
          purchased_at
        `,
      )
      .maybeSingle();

    /*
     * O checkout externo funcionou, mas
     * o banco não confirmou a atualização.
     *
     * Novamente: não fazemos outro checkout.
     */
    if (
      purchaseUpdateError ||
      !purchasedShipment
    ) {
      console.error(
        "Frete comprado, mas estado local não foi finalizado:",
        {
          shipmentId: shipment.id,
          databaseMessage:
            purchaseUpdateError?.message ??
            null,
        },
      );

      return NextResponse.json(
        {
          success: false,
          purchaseExecuted: true,
          needsReconciliation: true,
          shipmentId: shipment.id,
          message:
            "O Melhor Envio confirmou a compra, mas o estado local não pôde ser finalizado. Não tente comprar novamente automaticamente.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * 8. Compra concluída.
     *
     * Próxima etapa:
     * geração da etiqueta.
     */
    return NextResponse.json({
      success: true,
      purchaseExecuted: true,
      needsReconciliation: false,

      shipmentId:
        purchasedShipment.id,

      status:
        purchasedShipment.status,

      message:
        "Frete comprado no Melhor Envio Sandbox com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao comprar frete do pedido:",
      error instanceof Error
        ? error.message
        : "Erro desconhecido",
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao comprar o frete.",
      },
      {
        status: 500,
      },
    );
  }
}