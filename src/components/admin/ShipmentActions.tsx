"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ShipmentActionsProps = {
  orderId: string;
  orderStatus: string;
  shipmentStatus: string | null;
  providerStatus?: string | null;
  trackingCode?: string | null;
  generatedAt?: string | null;
  printedAt?: string | null;
  postedAt?: string | null;
  deliveredAt?: string | null;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  printUrl?: string;
  localStatus?: string;
  status?: string;
  synchronized?: { tracking?: boolean };
};

type ActionName = "prepare" | "purchase" | "generate" | "status" | "print" | "tracking";

function getShipmentStatusLabel(status: string | null) {
  switch (status) {
    case "pending":
      return "Preparando envio";

    case "cart":
      return "Frete preparado";

    case "purchasing":
      return "Compra do frete em processamento";

    case "purchased":
      return "Frete comprado";

    case "generating":
      return "Gerando etiqueta";

    case "generated":
      return "Etiqueta gerada";

    case "printed":
      return "Etiqueta pronta para envio";

    case "posted":
      return "Postado";

    case "in_transit":
      return "Em trânsito";

    case "delivered":
      return "Entregue";

    case "cancelled":
      return "Envio cancelado";

    case "error":
      return "Erro no envio";

    default:
      return status ? status : "Envio ainda não preparado";
  }
}

function getActionLabel(action: ActionName) {
  switch (action) {
    case "prepare":
      return "Preparar envio";

    case "purchase":
      return "Comprar frete";

    case "generate":
      return "Gerar etiqueta";

    case "status":
      return "Atualizar envio";

    case "print":
      return "Imprimir etiqueta";

    case "tracking":
      return "Atualizar rastreamento";

    default:
      return "Processando";
  }
}

function getLoadingLabel(action: ActionName) {
  switch (action) {
    case "prepare":
      return "Preparando...";

    case "purchase":
      return "Comprando...";

    case "generate":
      return "Solicitando geração...";

    case "status":
      return "Atualizando...";

    case "print":
      return "Abrindo etiqueta...";

    case "tracking":
      return "Consultando...";

    default:
      return "Processando...";
  }
}

async function readResponse(response: Response): Promise<ApiResponse> {
  try {
    return (await response.json()) as ApiResponse;
  } catch {
    return {
      success: false,
      message: "O servidor retornou uma resposta inválida.",
    };
  }
}

export default function ShipmentActions({
  orderId,
  orderStatus,
  shipmentStatus,
  providerStatus = null,
  trackingCode = null,
  generatedAt = null,
  printedAt = null,
  postedAt = null,
  deliveredAt = null,
}: ShipmentActionsProps) {
  const router = useRouter();

  const [loadingAction, setLoadingAction] = useState<ActionName | null>(null);

  const [message, setMessage] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const isLoading = loadingAction !== null;

  const isApproved = orderStatus === "approved";

  async function executeAction(
    action: ActionName,
    endpoint: string,
    method: "GET" | "POST",
  ) {
    if (isLoading) {
      return;
    }

    setLoadingAction(action);
    setMessage(null);
    setError(null);

    let printWindow: Window | null = null;

    /*
     * Abrimos a aba no momento exato do
     * clique para evitar bloqueadores de
     * pop-up dos navegadores.
     *
     * Se a API falhar, fechamos essa aba.
     */
    if (action === "print") {
      printWindow = window.open("about:blank", "_blank");

      if (!printWindow) {
        setLoadingAction(null);

        setError(
          "O navegador bloqueou a abertura da etiqueta. Permita pop-ups para este site e tente novamente.",
        );

        return;
      }

      /*
       * Remove a referência à página Admin
       * antes de navegar para o Melhor Envio.
       */
      printWindow.opener = null;
    }

    try {
      const response = await fetch(endpoint, {
        method,

        headers: {
          Accept: "application/json",
        },

        cache: "no-store",
      });

      const data = await readResponse(response);

      if (!response.ok || data.success === false) {
        if (printWindow) {
          printWindow.close();
        }

        throw new Error(data.message || "Não foi possível concluir esta ação.");
      }

      /*
       * Impressão:
       * a API devolve o link público
       * temporário da etiqueta.
       */
      if (action === "print") {
        if (!data.printUrl) {
          if (printWindow) {
            printWindow.close();
          }

          throw new Error("O link da etiqueta não foi retornado.");
        }

        if (!printWindow) {
          throw new Error("Não foi possível abrir a janela da etiqueta.");
        }

        printWindow.location.replace(data.printUrl);
      }

      const statusMessage = data.localStatus
        ? `Envio atualizado: ${getShipmentStatusLabel(data.localStatus)}.`
        : "Ação concluída com sucesso.";
      const trackingMessage =
        action === "tracking" && data.synchronized?.tracking === false
          ? data.localStatus === "delivered"
            ? " Entrega confirmada mesmo sem código de rastreio disponível."
            : " A transportadora ainda não disponibilizou o código de rastreio."
          : "";

      setMessage(data.message || statusMessage + trackingMessage);

      /*
       * Atualiza o Server Component para
       * refletir imediatamente o estado
       * salvo no Supabase.
       */
      router.refresh();
    } catch (actionError) {
      if (printWindow) {
        try {
          printWindow.close();
        } catch {
          // Nenhuma ação necessária.
        }
      }

      setError(
        actionError instanceof Error
          ? actionError.message
          : "Ocorreu um erro inesperado.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  function handlePrepare() {
    return executeAction(
      "prepare",
      `/api/admin/orders/${orderId}/shipment/prepare`,
      "POST",
    );
  }

  function handlePurchase() {
    return executeAction(
      "purchase",
      `/api/admin/orders/${orderId}/shipment/purchase`,
      "POST",
    );
  }

  function handleGenerate() {
    return executeAction(
      "generate",
      `/api/admin/orders/${orderId}/shipment/generate`,
      "POST",
    );
  }

  function handleStatus() {
    return executeAction("status", `/api/admin/orders/${orderId}/shipment/status`, "GET");
  }

  function handlePrint() {
    return executeAction("print", `/api/admin/orders/${orderId}/shipment/print`, "POST");
  }

  function handleTracking() {
    return executeAction(
      "tracking",
      `/api/admin/orders/${orderId}/shipment/tracking`,
      "GET",
    );
  }

  /*
   * Define a ação principal de acordo
   * com o estado atual do shipment.
   */
  let primaryAction: ActionName | null = null;

  if (isApproved && !shipmentStatus) {
    primaryAction = "prepare";
  } else if (shipmentStatus === "cart") {
    primaryAction = "purchase";
  } else if (shipmentStatus === "purchased") {
    primaryAction = "generate";
  } else if (["generating", "purchasing", "pending"].includes(shipmentStatus ?? "")) {
    primaryAction = "status";
  }

  const canPrint =
    Boolean(generatedAt) &&
    ["generated", "printed", "posted", "in_transit", "delivered"].includes(
      shipmentStatus ?? "",
    );

  const canTrack = ["generated", "printed", "posted", "in_transit", "delivered"].includes(
    shipmentStatus ?? "",
  );

  const requiresReconciliation =
    shipmentStatus === "purchasing" || shipmentStatus === "pending";

  return (
    <div className="border border-neutral-200 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-400">Logística</p>

          <h2 className="mt-2 text-lg font-semibold">Envio do pedido</h2>

          <p className="mt-2 text-sm text-neutral-500">
            {getShipmentStatusLabel(shipmentStatus)}
          </p>
        </div>

        {shipmentStatus && (
          <span className="w-fit border border-neutral-200 px-3 py-1 text-xs font-medium">
            {getShipmentStatusLabel(shipmentStatus)}
          </span>
        )}
      </div>

      {shipmentStatus === "delivered" && (
        <p className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
          Entrega confirmada. A etiqueta continua disponível para impressão.
        </p>
      )}

      {providerStatus && (
        <div className="mt-5 border-t border-neutral-100 pt-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-neutral-500">Status da transportadora</span>

            <span className="font-medium">{getShipmentStatusLabel(providerStatus)}</span>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3 text-sm">
        {generatedAt && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Etiqueta</span>

            <span>Gerada</span>
          </div>
        )}

        {printedAt && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Impressão</span>

            <span>Disponível</span>
          </div>
        )}

        {postedAt && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Postagem</span>

            <span>Confirmada</span>
          </div>
        )}

        {deliveredAt && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Entrega</span>

            <span>Concluída</span>
          </div>
        )}

        {trackingCode && (
          <div className="border-t border-neutral-100 pt-3">
            <p className="text-neutral-500">Código de rastreio</p>

            <p className="mt-1 break-all font-medium">{trackingCode}</p>
          </div>
        )}
      </div>

      {canTrack && !trackingCode && (
        <p className="mt-4 text-sm text-neutral-500">
          {shipmentStatus === "delivered"
            ? "A entrega foi confirmada pela transportadora, sem código de rastreio disponível."
            : "Código de rastreio ainda não disponível. Atualize o rastreamento para consultar a transportadora."}
        </p>
      )}

      {!isApproved && !shipmentStatus && (
        <div className="mt-6 border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
          O envio poderá ser preparado após a confirmação do pagamento.
        </div>
      )}

      {requiresReconciliation && (
        <div className="mt-6 border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-600">
          Existe uma operação de envio em processamento. Atualize o estado antes de
          repetir qualquer operação.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="mt-6 border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700"
        >
          {message}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {primaryAction && (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              if (primaryAction === "prepare") {
                void handlePrepare();
                return;
              }

              if (primaryAction === "purchase") {
                void handlePurchase();
                return;
              }

              if (primaryAction === "generate") {
                void handleGenerate();
                return;
              }

              if (primaryAction === "status") {
                void handleStatus();
              }
            }}
            className="inline-flex min-h-11 items-center justify-center bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingAction === primaryAction
              ? getLoadingLabel(primaryAction)
              : getActionLabel(primaryAction)}
          </button>
        )}

        {canPrint && (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              void handlePrint();
            }}
            className="inline-flex min-h-11 items-center justify-center border border-neutral-950 px-5 py-3 text-sm font-medium text-neutral-950 transition hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingAction === "print"
              ? getLoadingLabel("print")
              : getActionLabel("print")}
          </button>
        )}

        {canTrack && (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              void handleTracking();
            }}
            className="inline-flex min-h-11 items-center justify-center border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingAction === "tracking"
              ? getLoadingLabel("tracking")
              : getActionLabel("tracking")}
          </button>
        )}

        {shipmentStatus === "generated" && (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              void handleStatus();
            }}
            className="inline-flex min-h-11 items-center justify-center border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingAction === "status"
              ? getLoadingLabel("status")
              : getActionLabel("status")}
          </button>
        )}
      </div>
    </div>
  );
}
