import { NextResponse } from "next/server";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import { trackMelhorEnvioSandboxShipment } from "@/src/lib/melhor-envio/shipment";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

type UnknownRecord = Record<string, unknown>;

function asRecord(
  value: unknown,
): UnknownRecord | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as UnknownRecord;
}

function safeString(
  record: UnknownRecord,
  key: string,
) {
  const value = record[key];

  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return null;
  }

  const normalized =
    String(value).trim();

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

/*
 * O endpoint de tracking pode devolver
 * estruturas diferentes.
 *
 * Aceitamos:
 * - objeto direto;
 * - objeto indexado pelo ID;
 * - objeto dentro de "data";
 * - array com um objeto.
 */
function findTrackingRecord(
  response: unknown,
  providerShipmentId: string,
): UnknownRecord | null {
  if (Array.isArray(response)) {
    for (const item of response) {
      const record =
        asRecord(item);

      if (!record) {
        continue;
      }

      const id =
        safeString(
          record,
          "id",
        );

      if (
        id === providerShipmentId
      ) {
        return record;
      }
    }

    if (response.length === 1) {
      return asRecord(
        response[0],
      );
    }

    return null;
  }

  const root =
    asRecord(response);

  if (!root) {
    return null;
  }

  /*
   * Resposta indexada pelo ID
   * da etiqueta.
   */
  const byShipmentId =
    asRecord(
      root[providerShipmentId],
    );

  if (byShipmentId) {
    return byShipmentId;
  }

  /*
   * Resposta encapsulada em "data".
   */
  const data =
    root.data;

  if (Array.isArray(data)) {
    for (const item of data) {
      const record =
        asRecord(item);

      if (!record) {
        continue;
      }

      const id =
        safeString(
          record,
          "id",
        );

      if (
        id === providerShipmentId
      ) {
        return record;
      }
    }

    if (data.length === 1) {
      return asRecord(
        data[0],
      );
    }
  }

  const dataRecord =
    asRecord(data);

  if (dataRecord) {
    const dataByShipmentId =
      asRecord(
        dataRecord[
          providerShipmentId
        ],
      );

    if (dataByShipmentId) {
      return dataByShipmentId;
    }

    if (
      "status" in dataRecord ||
      "tracking" in dataRecord
    ) {
      return dataRecord;
    }
  }

  /*
   * A própria raiz já representa
   * a etiqueta.
   */
  if (
    "status" in root ||
    "tracking" in root
  ) {
    return root;
  }

  return null;
}

/*
 * Define a progressão dos estados locais.
 *
 * Usamos isso para impedir que uma
 * resposta antiga/cacheada faça o envio
 * regredir.
 */
const STATUS_RANK: Record<
  string,
  number
> = {
  pending: 0,
  cart: 1,
  purchasing: 2,
  purchased: 3,
  generating: 4,
  generated: 5,
  printed: 6,
  posted: 7,
  in_transit: 8,
  delivered: 9,
};

function advanceStatus(
  currentStatus: string,
  candidateStatus: string,
) {
  const currentRank =
    STATUS_RANK[currentStatus];

  const candidateRank =
    STATUS_RANK[candidateStatus];

  /*
   * Se algum estado não fizer parte
   * da progressão conhecida, mantemos
   * o estado atual.
   */
  if (
    currentRank === undefined ||
    candidateRank === undefined
  ) {
    return currentStatus;
  }

  if (candidateRank > currentRank) {
    return candidateStatus;
  }

  return currentStatus;
}

export async function GET(
  _request: Request,
  { params }: RouteProps,
) {
  try {
    /*
     * 1. Somente administradores podem
     * consultar/sincronizar tracking.
     */
    const admin =
      await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Não autorizado.",
        },
        {
          status: 401,
        },
      );
    }

    const { id: orderId } =
      await params;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pedido inválido.",
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
        "Erro ao consultar pedido para tracking:",
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
          message:
            "Pedido não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * 3. Busca o shipment local.
     *
     * Nesta fase ainda trabalhamos
     * com exatamente um shipment
     * do Melhor Envio por pedido.
     */
    const {
      data: shipments,
      error: shipmentsError,
    } = await supabaseAdmin
      .from("order_shipments")
      .select(
        `
          id,
          provider_shipment_id,
          status,
          provider_status,
          tracking_code,
          generated_at,
          posted_at,
          delivered_at
        `,
      )
      .eq(
        "order_id",
        order.id,
      )
      .eq(
        "provider",
        "melhor_envio",
      )
      .order(
        "created_at",
        {
          ascending: true,
        },
      );

    if (shipmentsError) {
      console.error(
        "Erro ao consultar shipment para tracking:",
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

    if (
      shipments.length !== 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Este pedido possui múltiplos envios. O tracking automático está bloqueado nesta fase.",
        },
        {
          status: 409,
        },
      );
    }

    const shipment =
      shipments[0];

    const providerShipmentId =
      String(
        shipment.provider_shipment_id ??
          "",
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
     * 4. Consulta o endpoint oficial
     * de tracking.
     */
    const trackingResult =
      await trackMelhorEnvioSandboxShipment(
        providerShipmentId,
      );

    /*
     * 5. Localiza somente o objeto
     * referente à nossa etiqueta.
     */
    const trackingRecord =
      findTrackingRecord(
        trackingResult.response,
        providerShipmentId,
      );

    if (!trackingRecord) {
      const root =
        asRecord(
          trackingResult.response,
        );

      return NextResponse.json(
        {
          success: false,

          message:
            "O Melhor Envio respondeu ao tracking, mas o formato não foi reconhecido.",

          diagnostic: {
            responseType:
              Array.isArray(
                trackingResult.response,
              )
                ? "array"
                : typeof trackingResult.response,

            rootFields:
              root
                ? Object.keys(root)
                    .sort()
                : [],
          },
        },
        {
          status: 502,
        },
      );
    }

    /*
     * 6. Extrai somente campos
     * conhecidos e necessários.
     */
    const providerStatus =
      safeString(
        trackingRecord,
        "status",
      )?.toLowerCase() ??
      null;

    const tracking =
      safeString(
        trackingRecord,
        "tracking",
      );

    const providerId =
      safeString(
        trackingRecord,
        "id",
      );

    const generatedAt =
      safeProviderDate(
        safeString(
          trackingRecord,
          "generated_at",
        ),
      );

    const postedAt =
      safeProviderDate(
        safeString(
          trackingRecord,
          "posted_at",
        ),
      );

    const deliveredAt =
      safeProviderDate(
        safeString(
          trackingRecord,
          "delivered_at",
        ),
      );

    /*
     * 7. Determina o próximo estado
     * local sem permitir regressões.
     */
    let nextLocalStatus =
      shipment.status;

    if (
      providerStatus === "delivered" ||
      deliveredAt
    ) {
      nextLocalStatus =
        advanceStatus(
          shipment.status,
          "delivered",
        );
    } else if (
      providerStatus === "posted" ||
      postedAt
    ) {
      nextLocalStatus =
        advanceStatus(
          shipment.status,
          "posted",
        );
    } else if (
      providerStatus === "generated" ||
      generatedAt
    ) {
      nextLocalStatus =
        advanceStatus(
          shipment.status,
          "generated",
        );
    }

    /*
     * Cancelamento não faz parte da
     * progressão numérica normal.
     *
     * Só registramos "cancelled" quando
     * o próprio provedor confirma esse
     * estado.
     *
     * Um envio já entregue não é
     * regredido para cancelado.
     */
    if (
      (
        providerStatus === "cancelled" ||
        providerStatus === "canceled"
      ) &&
      shipment.status !== "delivered"
    ) {
      nextLocalStatus =
        "cancelled";
    }

    /*
     * 8. Monta a sincronização.
     *
     * Campos ausentes no provedor não
     * apagam dados que já temos.
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

    /*
     * Só salvamos tracking_code se o
     * campo oficial "tracking" vier
     * preenchido.
     *
     * Não inferimos valor a partir de
     * melhorenvio_tracking.
     */
    if (tracking) {
      synchronization.tracking_code =
        tracking;
    }

    /*
     * 9. Sincroniza nosso shipment.
     */
    const {
      data: synchronizedShipment,
      error: synchronizationError,
    } = await supabaseAdmin
      .from("order_shipments")
      .update(
        synchronization,
      )
      .eq(
        "id",
        shipment.id,
      )
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
        "Erro ao sincronizar tracking do Melhor Envio:",
        synchronizationError?.message ??
          "Shipment não encontrado durante sincronização.",
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "O tracking foi consultado no Melhor Envio, mas não pôde ser sincronizado localmente.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * 10. Retorno sanitizado.
     *
     * Não devolvemos payload bruto,
     * endereço, CPF, telefone ou e-mail.
     */
    const responseFields =
      Object.keys(
        trackingRecord,
      ).sort();

    return NextResponse.json({
      success: true,

      shipmentId:
        synchronizedShipment.id,

      localStatus:
        synchronizedShipment.status,

      provider: {
        idMatches:
          providerId
            ? providerId ===
              providerShipmentId
            : null,

        status:
          providerStatus,

        trackingAvailable:
          Boolean(tracking),

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
      "Erro ao consultar tracking do envio:",
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
            : "Erro interno ao consultar o rastreamento.",
      },
      {
        status: 500,
      },
    );
  }
}