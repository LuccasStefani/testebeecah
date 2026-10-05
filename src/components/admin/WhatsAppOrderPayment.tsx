"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, CreditCard, LoaderCircle } from "lucide-react";
import { assistedCheckoutContent as content } from "@/src/content/assisted-checkout";
import { notify } from "@/src/lib/notifications";

export default function WhatsAppOrderPayment({
  id,
  status,
  ready,
  shipping,
  locked,
  storeUrl,
}: {
  id: string;
  status: string;
  ready: boolean;
  shipping: number | null;
  locked: boolean;
  storeUrl: string;
}) {
  const [freight, setFreight] = useState(shipping === null ? "" : shipping.toFixed(2));
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function release(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/orders/${id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingPrice: Number(freight.replace(",", ".")),
          deliveryConfirmed: confirmed,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      notify.success("Pagamento liberado.");
      router.refresh();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Não foi possível liberar o pagamento.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-neutral-950 p-5 text-white sm:p-7">
      <h2 className="flex items-center gap-3 text-xl">
        <CreditCard size={22} />
        {content.adminTitle}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-400">
        {content.adminDescription}
      </p>
      {ready ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm">{content.linkReady}</p>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(`${storeUrl}/checkout/pedido/${id}`);
                notify.success("Link copiado.");
              } catch {
                setError("Não foi possível copiar. Use o endereço do pedido abaixo.");
              }
            }}
            className="flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 text-sm text-black"
          >
            <Copy size={16} />
            {content.copy}
          </button>
          <p className="break-all text-xs text-neutral-400">/checkout/pedido/{id}</p>
        </div>
      ) : status === "pending" ? (
        <form onSubmit={release} className="mt-6 max-w-lg space-y-4">
          <label className="block text-sm">
            {content.freight}
            <input
              required
              disabled={busy || locked}
              type="number"
              min="0"
              max="10000"
              step="0.01"
              value={freight}
              onChange={(event) => setFreight(event.target.value)}
              className="mt-2 block min-h-12 w-full rounded-xl border border-white/20 bg-neutral-900 px-4 text-white"
            />
          </label>
          <label className="flex items-start gap-3 text-sm leading-6 text-neutral-300">
            <input
              type="checkbox"
              required
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1 size-4 accent-white"
            />
            {content.confirmDelivery}
          </label>
          <button
            disabled={busy || !confirmed || !freight.trim()}
            className="flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-black disabled:opacity-40"
          >
            {busy && <LoaderCircle size={16} className="animate-spin" />}
            {busy ? content.releasing : content.release}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm">Este pedido não está aguardando pagamento.</p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}
