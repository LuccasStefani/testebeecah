"use client";

import { MessageCircle, ArrowUpRight } from "lucide-react";
import { useCart } from "@/src/contexts/CartContext";
import { whatsappCartContent as content } from "@/src/content/whatsapp-cart";
import { buildCartWhatsAppUrl } from "@/src/lib/whatsapp-cart";

export default function ShareCartWhatsApp() {
  const { items, loading, updating, loadError } = useCart();
  const url = !loading && !updating && !loadError ? buildCartWhatsAppUrl(items) : null;
  if (!items.length) return null;

  const label = (
    <>
      <MessageCircle size={18} strokeWidth={1.6} aria-hidden="true" />
      <span>{content.button}</span>
      <ArrowUpRight size={16} aria-hidden="true" />
    </>
  );
  const style =
    "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-xs font-medium text-[#171914] transition-colors hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#171914] disabled:cursor-wait disabled:opacity-50";

  return (
    <div className="mt-5 border-t border-black/10 pt-5">
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className={style}>
          {label}
        </a>
      ) : (
        <button type="button" disabled className={style}>
          {label}
        </button>
      )}
      <p className="mt-2 text-center text-[11px] leading-5 text-neutral-500">
        {content.hint}
      </p>
    </div>
  );
}
