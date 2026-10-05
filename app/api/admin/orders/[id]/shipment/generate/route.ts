import { NextResponse } from "next/server";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import { requestMelhorEnvioSandboxLabelGeneration } from "@/src/lib/melhor-envio/shipment";
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
     * solicitar geração de etiquetas.
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
     * 2. O pedido precisa continuar aprovado.
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
        "Erro ao consultar pedido para geração da etiqueta:",
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
            "Somente pedidos aprovados podem gerar etiqueta.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 3. Busca os envios do Melhor Envio.
     *
     * Por enquanto exigimos exatamente
     * um shipment para evitar processamento
     * parcial em pedidos multivolume.
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
          purchased_at,
          generation_requested_at,
          generated_at
        `,
      )
      .eq("order_id", order.id)
      .eq("provider", "melhor_envio")
      .order("created_at", {
        ascending: true,
      });

    if (shipmentsError) {
      console.error(
        "Erro ao consultar shipment para geração:",
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
            "Este pedido possui múltiplos envios. A geração automática foi bloqueada para evitar processamento parcial.",
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
     * 4. Estados que já passaram pela geração.
     */
    if (
      shipment.status === "generated" ||
      shipment.status === "printed" ||
      shipment.status === "posted" ||
      shipment.status === "in_transit" ||
      shipment.status === "delivered"
    ) {
      return NextResponse.json(
        {
          success: false,
          generationExecuted: false,
          shipmentId: shipment.id,
          message:
            "Este envio já passou pela etapa de geração da etiqueta.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * "generating" significa que uma
     * solicitação anterior já pode ter
     * chegado ao Melhor Envio.
     *
     * Não enviamos outra solicitação.
     */
    if (shipment.status === "generating") {
      return NextResponse.json(
        {
          success: false,
          generationExecuted: false,
          needsReconciliation: true,
          shipmentId: shipment.id,
          message:
            "A geração desta etiqueta já foi solicitada. O estado do envio precisa ser consultado antes de qualquer nova tentativa.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Somente um frete comprado pode
     * iniciar a geração.
     */
    if (shipment.status !== "purchased") {
      return NextResponse.json(
        {
          success: false,
          generationExecuted: false,
          shipmentId: shipment.id,
          message:
            "O envio ainda não está disponível para geração da etiqueta.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 5. Adquire a trava local.
     *
     * Apenas uma requisição consegue:
     *
     * purchased -> generating
     *
     * Assim evitamos duas solicitações
     * simultâneas ao Melhor Envio.
     */
    const {
      data: claimedShipment,
      error: claimError,
    } = await supabaseAdmin
      .from("order_shipments")
      .update({
        status: "generating",
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", shipment.id)
      .eq("provider", "melhor_envio")
      .eq("status", "purchased")
      .eq(
        "provider_shipment_id",
        providerShipmentId,
      )
      .select(
        `
          id,
          provider_shipment_id,
          status
        `,
      )
      .maybeSingle();

    if (claimError) {
      console.error(
        "Erro ao reservar geração da etiqueta:",
        claimError.message,
      );

      return NextResponse.json(
        {
          success: false,
          generationExecuted: false,
          message:
            "Não foi possível reservar a geração da etiqueta.",
        },
        {
          status: 500,
        },
      );
    }

    if (!claimedShipment) {
      /*
       * Outra requisição adquiriu a trava
       * entre nossa leitura e o UPDATE.
       */
      return NextResponse.json(
        {
          success: false,
          generationExecuted: false,
          needsReconciliation: true,
          shipmentId: shipment.id,
          message:
            "A geração desta etiqueta já foi iniciada por outra requisição.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 6. Somente a requisição que adquiriu
     * a trava chega ao Melhor Envio.
     */
    try {
      await requestMelhorEnvioSandboxLabelGeneration(
        providerShipmentId,
      );
    } catch (providerError) {
      /*
       * Não voltamos para "purchased".
       *
       * Se a comunicação falhar depois de
       * o provedor receber a solicitação,
       * repetir automaticamente seria
       * inseguro.
       *
       * O próximo passo será consultar
       * o estado no Melhor Envio.
       */
      console.error(
        "Erro ao solicitar geração da etiqueta no Melhor Envio:",
        providerError instanceof Error
          ? providerError.message
          : "Erro desconhecido",
      );

      return NextResponse.json(
        {
          success: false,
          generationExecuted: true,
          needsReconciliation: true,
          shipmentId: shipment.id,
          message:
            "A solicitação foi enviada ao Melhor Envio, mas não foi possível confirmar o resultado. Não solicite outra geração automaticamente.",
        },
        {
          status: 502,
        },
      );
    }

    /*
     * 7. O provedor aceitou a solicitação.
     *
     * IMPORTANTE:
     *
     * Ainda NÃO marcamos "generated".
     * A geração do Melhor Envio pode ser
     * processada de forma assíncrona.
     */
    const generationRequestedAt =
      new Date().toISOString();

    const {
      data: generatingShipment,
      error: generationUpdateError,
    } = await supabaseAdmin
      .from("order_shipments")
      .update({
        generation_requested_at:
          generationRequestedAt,
        updated_at:
          generationRequestedAt,
      })
      .eq("id", shipment.id)
      .eq("provider", "melhor_envio")
      .eq("status", "generating")
      .eq(
        "provider_shipment_id",
        providerShipmentId,
      )
      .select(
        `
          id,
          status,
          provider_shipment_id,
          generation_requested_at,
          generated_at
        `,
      )
      .maybeSingle();

    /*
     * O Melhor Envio aceitou a geração,
     * mas não conseguimos registrar isso
     * localmente.
     *
     * Não repetimos a chamada externa.
     */
    if (
      generationUpdateError ||
      !generatingShipment
    ) {
      console.error(
        "Geração solicitada, mas estado local não foi finalizado:",
        {
          shipmentId: shipment.id,
          databaseMessage:
            generationUpdateError?.message ??
            null,
        },
      );

      return NextResponse.json(
        {
          success: false,
          generationExecuted: true,
          needsReconciliation: true,
          shipmentId: shipment.id,
          message:
            "O Melhor Envio aceitou a solicitação de geração, mas o estado local não pôde ser finalizado. Não tente gerar novamente automaticamente.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * 8. Solicitação aceita.
     *
     * O status continua "generating".
     *
     * O próximo passo será consultar o
     * Melhor Envio para descobrir quando
     * a etiqueta realmente estiver pronta.
     */
    return NextResponse.json({
      success: true,
      generationExecuted: true,
      generationConfirmed: false,
      needsReconciliation: false,

      shipmentId:
        generatingShipment.id,

      status:
        generatingShipment.status,

      message:
        "Geração da etiqueta solicitada ao Melhor Envio Sandbox. Aguardando confirmação do processamento.",
    });
  } catch (error) {
    console.error(
      "Erro ao gerar etiqueta do pedido:",
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
            : "Erro interno ao gerar a etiqueta.",
      },
      {
        status: 500,
      },
    );
  }
}