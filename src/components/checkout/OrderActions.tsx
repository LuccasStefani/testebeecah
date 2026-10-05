"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, MessageCircle, RefreshCw } from "lucide-react";
import { assistedCheckoutContent as content } from "@/src/content/assisted-checkout";

export default function OrderActions({
  whatsappUrl,
  paymentUrl,
  pending,
}: {
  whatsappUrl: string;
  paymentUrl: string | null;
  pending: boolean;
}) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  useEffect(() => {
    if (!pending) return;
    let checks = 0;
    const refresh = () => {
      if (document.visibilityState === "visible") startTransition(() => router.refresh());
    };
    const timer = window.setInterval(() => {
      if (++checks <= 40) refresh();
    }, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [pending, router]);
  return (
    <div className="space-y-3">
      {paymentUrl && (
        <a
          href={paymentUrl}
          className="flex min-h-14 items-center justify-center gap-3 rounded-xl bg-[#171914] px-5 text-sm font-medium text-white"
        >
          {content.pay}
          <ArrowUpRight size={18} />
        </a>
      )}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex min-h-14 items-center justify-center gap-3 rounded-xl px-5 text-sm font-medium ${paymentUrl ? "bg-white text-black" : "bg-[#171914] text-white"}`}
      >
        <MessageCircle size={18} />
        {content.talk}
        <ArrowUpRight size={18} />
      </a>
      {pending && (
        <button
          type="button"
          disabled={refreshing}
          onClick={() => startTransition(() => router.refresh())}
          className="flex min-h-11 w-full items-center justify-center gap-2 text-xs text-neutral-600"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {content.refresh}
        </button>
      )}
    </div>
  );
}
