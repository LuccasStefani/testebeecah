"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, LoaderCircle, MessageCircle, ShieldCheck } from "lucide-react";
import { useCart } from "@/src/contexts/CartContext";
import { assistedCheckoutContent as content } from "@/src/content/assisted-checkout";

export default function AssistedCheckoutSummary() {
  const { totalPrice, totalItems, items, loading, updating, loadError } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const router = useRouter();
  const unavailable = items.some((item) => item.quantity > item.stock || item.stock <= 0);
  async function continueOrder() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const whatsappTab = window.open("about:blank", "_blank");
    if (whatsappTab) whatsappTab.opener = null;
    try {
      const response = await fetch("/api/checkout/whatsapp", { method: "POST" });
      if (response.status === 401) {
        whatsappTab?.close();
        router.push("/login?next=/carrinho");
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || content.error);
      if (whatsappTab && !whatsappTab.closed)
        whatsappTab.location.replace(data.whatsappUrl);
      router.push(`/checkout/pedido/${data.orderId}`);
    } catch (failure) {
      whatsappTab?.close();
      setError(failure instanceof Error ? failure.message : content.error);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div>
      <div className="pb-6">
        <p className="text-lg font-medium">{content.intro}</p>
        <p className="mt-2 text-sm leading-6 text-neutral-600">{content.description}</p>
      </div>
      <dl className="space-y-4 border-y border-black/10 py-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt>Produtos</dt>
          <dd>
            {totalItems} {totalItems === 1 ? "item" : "itens"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Entrega</dt>
          <dd className="text-right text-neutral-500">{content.shipping}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap items-end justify-between gap-3 py-6">
        <span className="text-sm text-neutral-600">{content.subtotal}</span>
        <strong className="text-3xl font-medium tracking-tight">
          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
            totalPrice,
          )}
        </strong>
      </div>
      <button
        type="button"
        onClick={continueOrder}
        disabled={
          busy || loading || updating || !!loadError || unavailable || !items.length
        }
        className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#171914] px-4 py-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-45"
      >
        {busy ? (
          <LoaderCircle size={18} className="animate-spin" />
        ) : (
          <MessageCircle size={18} />
        )}
        {busy ? content.preparing : content.button}
        {!busy && <ArrowUpRight size={18} />}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {unavailable && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          Revise os produtos sem estoque antes de continuar.
        </p>
      )}
      <p className="mt-4 flex gap-2 text-xs leading-5 text-neutral-500">
        <ShieldCheck size={17} className="mt-0.5 shrink-0" />
        {content.note}
      </p>
    </div>
  );
}
