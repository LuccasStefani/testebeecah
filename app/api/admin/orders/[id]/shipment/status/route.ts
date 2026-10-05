import { NextResponse } from "next/server";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import { getMelhorEnvioSandboxShipment } from "@/src/lib/melhor-envio/shipment";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function asRecord(
  value: unknown,
): Record<string, unknown> | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<string, unknown>;
}

function safeString(
  record: Record<string, unknown>,
  key: string,
) {
  const value = record[key];

  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return null;
  }

  const normalized = String(value).trim();

  return normalized || null;
}

function safeProviderDate(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export async function GET(
  _request: Request,
  { params }: RouteProps,
) {
  try {
    /*
     * 1. Somente administradores podem
     * consultar/sincronizar o estado remoto.
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
        "Erro ao consultar pedido para status do envio:",
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
     * 3. Busca o shipment local.
     *
     * Nesta fase controlada do Sandbox
     * continuamos exigindo exatamente
     * um shipment do Melhor Envio.
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
          generation_requested_at,
          generated_at,
          posted_at,
          delivered_at,
          tracking_code,
          provider_status
        `,
      )
      .eq("order_id", order.id)
      .eq("provider", "melhor_envio")
      .order("created_at", {
        ascending: true,
      });

    if (shipmentsError) {
      console.error(
        "Erro ao consultar shipment local:",
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
            "Este pedido possui múltiplos envios. A sincronização automática está bloqueada nesta fase.",
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
     * 4. Consulta o estado real no
     * Melhor Envio.
     */
    const providerResult =
      await getMelhorEnvioSandboxShipment(
        providerShipmentId,
      );

    const providerData =
      asRecord(providerResult.response);

    if (!providerData) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O Melhor Envio retornou um formato inesperado.",
        },
        {
          status: 502,
        },
      );
    }

    /*
     * 5. Extraímos somente informações
     * necessárias e seguras.
     *
     * Não retornamos:
     * - CPF;
     * - endereço;
     * - telefone;
     * - e-mail;
     * - remetente;
     * - destinatário;
     * - payload completo.
     */
    const providerStatus =
      safeString(
        providerData,
        "status",
      )?.toLowerCase() ?? null;

    const tracking =
      safeString(
        providerData,
        "tracking",
      );

    const protocol =
      safeString(
        providerData,
        "protocol",
      );

    const generatedAt =
      safeProviderDate(
        safeString(
          providerData,
          "generated_at",
        ),
      );

    const postedAt =
      safeProviderDate(
        safeString(
          providerData,
          "posted_at",
        ),
      );

    const deliveredAt =
      safeProviderDate(
        safeString(
          providerData,
          "delivered_at",
        ),
      );

    const paidAt =
      safeProviderDate(
        safeString(
          providerData,
          "paid_at",
        ),
      );

    const providerUpdatedAt =
      safeProviderDate(
        safeString(
          providerData,
          "updated_at",
        ),
      );

    /*
     * 6. Traduzimos somente estados
     * conhecidos e seguros para o nosso
     * ciclo local.
     *
     * suspended / paused / undelivered
     * continuam registrados em
     * provider_status, sem serem
     * convertidos artificialmente
     * para "error".
     */
    let nextLocalStatus =
      shipment.status;

    if (
      providerStatus === "cancelled" ||
      providerStatus === "canceled"
    ) {
      nextLocalStatus =
        "cancelled";
    } else if (
      providerStatus === "delivered" ||
      deliveredAt
    ) {
      nextLocalStatus =
        "delivered";
    } else if (
      providerStatus === "posted" ||
      postedAt
    ) {
      nextLocalStatus =
        "posted";
    } else if (
      providerStatus === "generated" ||
      generatedAt
    ) {
      /*
       * Não regredimos um shipment que
       * localmente já avançou além de
       * "generated".
       */
      if (
        shipment.status !== "printed" &&
        shipment.status !== "posted" &&
        shipment.status !== "in_transit" &&
        shipment.status !== "delivered"
      ) {
        nextLocalStatus =
          "generated";
      }
    }

    /*
     * 7. Monta somente os campos que
     * realmente podemos confirmar.
     */
    const synchronization: Record<
      string,
      string
    > = {
      status:
        nextLocalStatus,

      provider_status:
        providerStatus ?? "unknown",

      provider_status_updated_at:
        providerUpdatedAt ??
        new Date().toISOString(),

      updated_at:
        new Date().toISOString(),
    };

    if (generatedAt) {
      synchronization.generated_at =
        generatedAt;
    }

    if (postedAt) {
      synchronization.posted_at =
        postedAt;
    }

    if (deliveredAt) {
      synchronization.delivered_at =
        deliveredAt;
    }

    if (tracking) {
      synchronization.tracking_code =
        tracking;
    }

    /*
     * 8. Sincroniza o estado local com
     * o estado confirmado pelo provedor.
     */
    const {
      data: synchronizedShipment,
      error: synchronizationError,
    } = await supabaseAdmin
      .from("order_shipments")
      .update(synchronization)
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
          provider_status,
          tracking_code,
          generated_at,
          posted_at,
          delivered_at
        `,
      )
      .maybeSingle();

    if (
      synchronizationError ||
      !synchronizedShipment
    ) {
      console.error(
        "Erro ao sincronizar estado do Melhor Envio:",
        synchronizationError?.message ??
          "Shipment não encontrado durante sincronização.",
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "O estado foi consultado no Melhor Envio, mas não pôde ser sincronizado localmente.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * 9. Para diagnóstico do Sandbox,
     * retornamos somente os NOMES dos
     * campos recebidos.
     *
     * Nenhum valor desconhecido ou
     * informação pessoal é exposto.
     */
    const responseFields =
      Object.keys(providerData)
        .sort();

    return NextResponse.json({
      success: true,

      shipmentId:
        synchronizedShipment.id,

      localStatus:
        synchronizedShipment.status,

      provider: {
        status:
          providerStatus,

        protocolAvailable:
          Boolean(protocol),

        trackingAvailable:
          Boolean(tracking),

        generatedAtAvailable:
          Boolean(generatedAt),

        postedAtAvailable:
          Boolean(postedAt),

        deliveredAtAvailable:
          Boolean(deliveredAt),

        paidAtAvailable:
          Boolean(paidAt),

        responseFields,
      },

      synchronized: {
        generated:
          Boolean(
            synchronizedShipment.generated_at,
          ),

        posted:
          Boolean(
            synchronizedShipment.posted_at,
          ),

        delivered:
          Boolean(
            synchronizedShipment.delivered_at,
          ),

        tracking:
          Boolean(
            synchronizedShipment.tracking_code,
          ),
      },
    });
  } catch (error) {
    console.error(
      "Erro ao consultar estado do envio:",
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
            : "Erro interno ao consultar o envio.",
      },
      {
        status: 500,
      },
    );
  }
}