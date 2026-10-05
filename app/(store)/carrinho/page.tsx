"use client";

import { productTypeLabel } from "@/src/content/product-types";
import { checkoutContent } from "@/src/content/checkout";
import Image from "next/image";
import { Playfair_Display } from "next/font/google";
import { cartContent } from "@/src/content/cart";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, LoaderCircle } from "lucide-react";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { motion, useReducedMotion } from "motion/react";
import { notify } from "@/src/lib/notifications";
import ShareCartWhatsApp from "@/src/components/checkout/ShareCartWhatsApp";
import CheckoutSteps from "@/src/components/checkout/CheckoutSteps";
import AssistedCheckoutSummary from "@/src/components/checkout/AssistedCheckoutSummary";
import { checkoutMode } from "@/src/lib/checkout-mode";
import CheckoutSummary from "@/src/components/checkout/CheckoutSummary";
import { useCart } from "@/src/contexts/CartContext";

const playfair = Playfair_Display({ subsets: ["latin"], weight: "400", display: "swap" });

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function CartPage() {
  const [confirmClear, setConfirmClear] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    loading,
    updating,
    loadError,
    retryLoad,
    totalPrice,
  } = useCart();
  const reducedMotion = useReducedMotion();
  const continueRef = useRef<HTMLAnchorElement>(null);
  async function act(action: () => Promise<void>, message: string, removed = false) {
    try {
      await action();
      setAnnouncement(message);
      if (removed) requestAnimationFrame(() => continueRef.current?.focus());
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Não foi possível atualizar a sacola.",
      );
    }
  }

  if (loading)
    return (
      <section
        aria-busy="true"
        aria-label="Carregando sacola"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-8"
      >
        <p role="status" className="mb-6 text-sm text-neutral-600">
          Carregando sua sacola…
        </p>
        <div aria-hidden="true" className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="divide-y divide-neutral-200">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-44 rounded-[22px] bg-neutral-100 motion-safe:animate-pulse"
              />
            ))}
          </div>
          <div className="h-80 rounded-[26px] bg-neutral-100 motion-safe:animate-pulse" />
        </div>
      </section>
    );
  if (loadError)
    return (
      <section className="mx-auto max-w-xl px-5 py-16 text-center">
        <p role="alert">{loadError}</p>
        <button
          onClick={retryLoad}
          className="mt-5 min-h-11 rounded-xl bg-beecah-black px-6 text-sm text-white"
        >
          Tentar novamente
        </button>
      </section>
    );

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-xl px-5 py-16 text-center">
        <ShoppingBag
          size={32}
          strokeWidth={1.3}
          className="mx-auto text-neutral-400"
          aria-hidden="true"
        />
        <h2 className={playfair.className + " mt-6 text-3xl"}>{cartContent.empty}</h2>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          {cartContent.emptyDescription}
        </p>
        <Link
          href="/perfumes"
          className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#171914] px-6 text-sm text-white"
        >
          {cartContent.continue}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
    );
  }

  return (
    <section className="beecah-cart w-full bg-white px-4 py-6 sm:px-8 sm:py-10 [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-4">
      <a
        href="#resumo-pedido"
        className="mb-5 flex min-h-12 items-center justify-between rounded-xl bg-[#f4f3ef] px-4 text-sm lg:hidden"
      >
        <span>
          {cartContent.summary} · {formatPrice(totalPrice)}
        </span>
        <ArrowRight size={16} aria-hidden="true" />
      </a>
      <div className="mx-auto grid w-full max-w-7xl items-start gap-8 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px] xl:gap-12">
        <div className="min-w-0 py-3">
          <div className="mb-7">
            <CheckoutSteps current={1} />
          </div>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h2 className={playfair.className + " text-3xl tracking-tight sm:text-4xl"}>
                {cartContent.products}
              </h2>
              <div className="mt-4 flex items-center gap-3">
                <span className="h-0.5 w-8 bg-beecah-black" />

                <span className="text-xs font-medium uppercase tracking-[0.35em] text-beecah-black/55">
                  {checkoutContent.seuCarrinho}
                </span>

                <span className="text-xs text-beecah-black/35">
                  {"("}
                  {totalItems}
                  {")"}
                </span>
              </div>
            </div>

            <AlertDialog.Root open={confirmClear} onOpenChange={setConfirmClear}>
              <AlertDialog.Trigger
                disabled={updating}
                className="mb-1 flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-beecah-black"
              >
                {checkoutContent.limparLista}
                <Trash2 size={13} strokeWidth={1.7} />
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Backdrop className="fixed inset-0 z-[100] bg-black/35" />
                <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[22px] bg-white p-6 shadow-xl">
                  <AlertDialog.Title className="text-lg font-medium">
                    Esvaziar sua sacola?
                  </AlertDialog.Title>
                  <AlertDialog.Description className="mt-2 text-sm leading-6 text-neutral-600">
                    {checkoutContent.removerTodosOsProdutosDaSacola}
                  </AlertDialog.Description>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <AlertDialog.Close
                      disabled={updating}
                      className="min-h-11 rounded-xl bg-neutral-100 px-4 text-xs"
                    >
                      {checkoutContent.manterProdutos}
                    </AlertDialog.Close>
                    <button
                      disabled={updating}
                      onClick={() =>
                        void act(async () => {
                          await clearCart();
                          setConfirmClear(false);
                        }, "Sacola esvaziada.")
                      }
                      className="min-h-11 rounded-xl bg-beecah-black px-4 text-xs text-white disabled:opacity-50"
                    >
                      {updating ? "Removendo…" : checkoutContent.esvaziarSacola}
                    </button>
                  </div>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </div>

          <p role="status" className="sr-only">
            {announcement}
          </p>
          {/* Produtos */}
          <div className="space-y-3">
            {items.map((item) => (
              <motion.article
                layout={!reducedMotion}
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: reducedMotion ? 0 : 0.18 }}
                aria-busy={updating}
                key={item.id}
                className="group grid grid-cols-[5rem_minmax(0,1fr)] gap-3 min-[380px]:grid-cols-[6.5rem_minmax(0,1fr)] min-[380px]:gap-4 py-6 first:pt-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6"
              >
                {/* Imagem */}
                <Link
                  href={`/perfumes/${item.slug}`}
                  className="relative aspect-[4/5] self-start overflow-hidden rounded-2xl bg-[#f4f3ef]"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 379px) 80px, (max-width: 640px) 104px, 160px"
                      className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBag
                        aria-hidden="true"
                        size={28}
                        className="text-neutral-400"
                      />
                    </span>
                  )}
                </Link>

                {/* Conteúdo */}
                <div className="flex min-w-0 flex-col justify-between py-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/perfumes/${item.slug}`}
                        className="line-clamp-2 text-base font-medium leading-snug text-beecah-black transition hover:text-beecah-blue sm:text-xl"
                      >
                        {item.name}
                      </Link>

                      <p className="mt-1 text-xs text-beecah-black/45">
                        {item.stock <= 0
                          ? "Indisponível — remova para continuar"
                          : item.quantity >= item.stock
                            ? checkoutContent.limiteDeEstoqueAtingido
                            : productTypeLabel(item.productType)}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={updating}
                      onClick={() =>
                        void act(
                          () => removeItem(item.id),
                          item.name + checkoutContent.removidoDaSacola,
                          true,
                        )
                      }
                      aria-label={`Remover ${item.name}`}
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-neutral-500 transition hover:bg-white hover:text-red-700"
                    >
                      <Trash2 size={16} strokeWidth={1.7} />
                    </button>
                  </div>

                  <div className="mt-2">
                    <p
                      className={[
                        "font-['Sorts_Mill_Goudy',serif] font-normal not-italic",
                        "text-2xl",
                        "font-semibold",
                        "leading-none",
                        "text-beecah-black",
                        "sm:text-3xl",
                      ].join(" ")}
                    >
                      {formatPrice(item.price * item.quantity)}
                    </p>

                    <p className="mt-1 text-xs text-beecah-black/45">
                      {formatPrice(item.price)}
                      {checkoutContent.cada}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="hidden text-xs text-neutral-500 sm:inline-flex">
                      {checkoutContent.quantidade}
                    </span>

                    <div className="ml-auto flex items-center gap-1 rounded-xl bg-[#f4f3ef] p-1">
                      <span className="order-2 min-w-7 text-center text-sm font-medium text-beecah-black">
                        {updating ? (
                          <LoaderCircle
                            size={14}
                            aria-label="Atualizando"
                            className="mx-auto motion-safe:animate-spin"
                          />
                        ) : (
                          item.quantity
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          void act(
                            () => updateQuantity(item.id, item.quantity - 1),
                            "Quantidade atualizada.",
                          )
                        }
                        disabled={updating || item.quantity <= 1 || item.stock <= 0}
                        aria-label={`Diminuir quantidade de ${item.name}`}
                        className="order-1 flex size-11 items-center justify-center rounded-lg text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Minus size={14} strokeWidth={1.8} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void act(
                            () => updateQuantity(item.id, item.quantity + 1),
                            "Quantidade atualizada.",
                          )
                        }
                        disabled={updating || item.quantity >= item.stock}
                        aria-label={`Aumentar quantidade de ${item.name}`}
                        className="order-3 flex size-11 items-center justify-center rounded-lg text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Plus size={14} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <Link
            ref={continueRef}
            href="/perfumes"
            className="mt-5 inline-flex min-h-11 items-center gap-2 text-xs font-medium uppercase tracking-wide text-beecah-black/45 transition hover:text-beecah-black"
          >
            <span className="text-base">{"←"}</span>
            {checkoutContent.continuarComprando}
          </Link>
        </div>

        {/* RESUMO */}
        <aside
          id="resumo-pedido"
          tabIndex={-1}
          aria-label="Resumo do pedido"
          className="scroll-mt-28 relative min-w-0 rounded-[26px] bg-[#f4f3ef] p-6 sm:p-8"
        >
          <h2 className={playfair.className + " mb-6 text-3xl tracking-tight"}>
            {cartContent.summary}
          </h2>

          {checkoutMode === "whatsapp" ? (
            <AssistedCheckoutSummary />
          ) : (
            <>
              <CheckoutSummary />
              <ShareCartWhatsApp />
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
