import Link from "next/link";
import Image from "next/image";
import { Check, Clock3, ArrowRight } from "lucide-react";
import { Playfair_Display } from "next/font/google";
import { assistedCheckoutContent as content } from "@/src/content/assisted-checkout";
import {
  formatOrderMoney,
  orderNumber,
  orderPhase,
  orderWhatsAppUrl,
} from "@/src/lib/assisted-order";
import CheckoutSteps from "./CheckoutSteps";
import OrderActions from "./OrderActions";

const playfair = Playfair_Display({ subsets: ["latin"], weight: "400", display: "swap" });
export type ReceiptOrder = {
  id: string;
  status: string;
  total: number | string;
  subtotal: number | string;
  shipping_price: number | string | null;
  checkout_channel: string;
  checkout_payment_url: string | null;
  expires_at: string | null;
  order_items: {
    id: string;
    product_name: string;
    quantity: number;
    subtotal: number | string;
  }[];
};
export default function OrderReceipt({
  order,
  expired = false,
}: {
  order: ReceiptOrder | null;
  expired?: boolean;
}) {
  const phase = order
    ? orderPhase(order.status, !!order.checkout_payment_url, expired)
    : "missing";
  const paid = phase === "paid";
  const title = paid
    ? content.paid
    : phase === "ready"
      ? content.ready
      : phase === "waiting"
        ? content.registered
        : phase === "missing"
          ? content.missing
          : content.terminal;
  const description = paid
    ? content.paidDescription
    : phase === "ready"
      ? content.readyDescription
      : phase === "waiting"
        ? content.registeredDescription
        : phase === "missing"
          ? content.missingDescription
          : content.terminalDescription;
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
      <div className="grid overflow-hidden rounded-[28px] bg-[#f4f3ef] lg:grid-cols-[0.85fr_1.15fr]">
        <div className="relative isolate flex min-h-64 flex-col justify-end overflow-hidden bg-[#171914] p-7 text-white sm:p-10 lg:min-h-full">
          <Image
            src="/images/banners/bento2.jpeg"
            alt=""
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="relative">
            <span className="mb-5 flex size-12 items-center justify-center rounded-full border border-white/40">
              {paid ? <Check size={23} /> : <Clock3 size={23} />}
            </span>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/70">
              Beecah Collection
            </p>
            <h1
              className={
                playfair.className +
                " mt-4 max-w-md text-4xl leading-[1.08] tracking-tight sm:text-5xl"
              }
            >
              {title}
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/80">{description}</p>
          </div>
        </div>
        <div className="min-w-0 p-5 sm:p-8 lg:p-10">
          <CheckoutSteps current={paid || phase === "ready" ? 3 : 2} complete={paid} />
          {paid && (
            <div role="status" className="mt-6 rounded-2xl bg-white p-5">
              <p className="flex items-center gap-2 text-base font-medium">
                <Check size={18} />
                {content.placed}
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                {content.placedDescription}
              </p>
            </div>
          )}
          {order && (
            <>
              <div className="my-7 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-neutral-500">{content.order}</p>
                  <p className="mt-1 text-2xl font-medium tracking-wider">
                    #{orderNumber(order.id)}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-2 text-xs">
                  {paid
                    ? "Pagamento confirmado"
                    : phase === "waiting"
                      ? content.waiting
                      : phase === "ready"
                        ? content.pending
                        : content.terminal}
                </span>
              </div>
              <ul className="space-y-3 border-y border-black/10 py-5">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 text-sm">
                    <span className="min-w-0">
                      {item.quantity} × {item.product_name}
                    </span>
                    <span className="shrink-0">{formatOrderMoney(item.subtotal)}</span>
                  </li>
                ))}
              </ul>
              <dl className="space-y-3 py-5">
                <div className="flex justify-between gap-3 text-sm text-neutral-600">
                  <dt>Entrega</dt>
                  <dd>
                    {order.shipping_price === null
                      ? content.shipping
                      : formatOrderMoney(order.shipping_price)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-sm">
                    {order.shipping_price === null ? content.subtotal : "Total do pedido"}
                  </dt>
                  <dd className="text-2xl font-medium">
                    {formatOrderMoney(order.total)}
                  </dd>
                </div>
              </dl>
              <OrderActions
                whatsappUrl={orderWhatsAppUrl(order)}
                paymentUrl={phase === "ready" ? order.checkout_payment_url : null}
                pending={phase === "waiting" || phase === "ready"}
              />
              <Link
                href={`/minha-conta/pedidos/${order.id}`}
                className="mt-4 flex min-h-11 items-center justify-center text-xs underline underline-offset-4"
              >
                {content.details}
              </Link>
            </>
          )}
          <Link
            href="/perfumes"
            className="mt-5 flex min-h-11 items-center justify-center gap-3 text-sm text-neutral-600"
          >
            {content.keepShopping}
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
