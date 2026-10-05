import { NextResponse } from "next/server";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import { printMelhorEnvioSandboxShipment } from "@/src/lib/melhor-envio/shipment";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const PRINTABLE_STATUSES = new Set([
  "generated",
  "printed",
  "posted",
  "in_transit",
  "delivered",
]);

export async function POST(
  _request: Request,
  { params }: RouteProps,
) {
  try {
    /*
     * 1. Somente administradores podem
     * solicitar o link de impressão.
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
     * 2. Confirma que o pedido existe.
     */
    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error(
        "Erro ao consultar pedido para impressão:",
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

    /*
     * 3. Busca o shipment do Melhor Envio.
     *
     * Nesta fase do projeto trabalhamos
     * com exatamente um shipment por pedido.
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
          generated_at,
          printed_at
        `,
      )
      .eq("order_id", order.id)
      .eq("provider", "melhor_envio")
      .order("created_at", {
        ascending: true,
      });

    if (shipmentsError) {
      console.error(
        "Erro ao consultar shipment para impressão:",
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

    if (
      !shipments ||
      shipments.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O pedido ainda não possui um envio.",
        },
        {
          status: 404,
        },
      );
    }

    if (shipments.length !== 1) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Este pedido possui múltiplos envios. A impressão automática está bloqueada nesta fase.",
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
     * 4. A impressão só pode acontecer
     * depois da geração da etiqueta.
     *
     * Nosso shipment atual está "posted",
     * que é posterior à geração, portanto
     * continua imprimível.
     */
    if (
      !shipment.generated_at ||
      !PRINTABLE_STATUSES.has(
        shipment.status,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A etiqueta ainda não foi confirmada como gerada.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 5. Solicita somente o link público
     * de impressão.
     *
     * Esta chamada não compra nem gera
     * uma nova etiqueta.
     */
    const printResult =
      await printMelhorEnvioSandboxShipment(
        providerShipmentId,
      );

    /*
     * 6. Registramos que um link válido
     * de impressão foi obtido.
     *
     * IMPORTANTE:
     * não mudamos o status para "printed"
     * se o shipment já avançou para
     * posted/in_transit/delivered.
     */
    const printedAt =
      shipment.printed_at ??
      new Date().toISOString();

    const shouldMarkAsPrinted =
      shipment.status === "generated";

    const updateData: {
      printed_at: string;
      updated_at: string;
      status?: string;
    } = {
      printed_at:
        printedAt,

      updated_at:
        new Date().toISOString(),
    };

    if (shouldMarkAsPrinted) {
      updateData.status =
        "printed";
    }

    const {
      data: updatedShipment,
      error: updateError,
    } = await supabaseAdmin
      .from("order_shipments")
      .update(updateData)
      .eq("id", shipment.id)
      .eq(
        "provider",
        "melhor_envio",
      )
      .eq(
        "provider_shipment_id",
        providerShipmentId,
      )
      .select(
        `
          id,
          status,
          printed_at
        `,
      )
      .maybeSingle();

    if (
      updateError ||
      !updatedShipment
    ) {
      console.error(
        "Erro ao registrar impressão da etiqueta:",
        updateError?.message ??
          "Shipment não encontrado durante atualização.",
      );

      /*
       * O link foi obtido com sucesso no
       * provedor, mas não conseguimos
       * registrar printed_at localmente.
       *
       * Não repetimos automaticamente a
       * chamada ao Melhor Envio.
       */
      return NextResponse.json(
        {
          success: false,
          message:
            "O link da etiqueta foi obtido, mas não foi possível registrar a impressão localmente.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * 7. Retornamos apenas o link necessário
     * para o painel administrativo.
     *
     * Nenhum payload bruto do Melhor Envio
     * é exposto.
     */
    return NextResponse.json({
      success: true,

      shipmentId:
        updatedShipment.id,

      status:
        updatedShipment.status,

      printUrl:
        printResult.url,

      printed:
        Boolean(
          updatedShipment.printed_at,
        ),

      message:
        "Link de impressão da etiqueta obtido com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao solicitar impressão da etiqueta:",
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
            : "Erro interno ao solicitar impressão da etiqueta.",
      },
      {
        status: 500,
      },
    );
  }
}