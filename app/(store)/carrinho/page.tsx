"use client";

import { checkoutContent } from "@/src/content/checkout";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import CheckoutSummary from "@/src/components/checkout/CheckoutSummary";
import { useCart } from "@/src/contexts/CartContext";

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function CartPage() {
  const [confirmClear, setConfirmClear] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const { items, removeItem, updateQuantity, clearCart } = useCart();

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  if (items.length === 0) {
    return (
      <section className="w-full bg-beecah-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-neutral-100">
            <ShoppingBag size={22} strokeWidth={1.4} />
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.35em] text-beecah-black/45">
            {checkoutContent.seuCarrinho}
          </p>

          <h1
            className={[
              "font-['Sorts_Mill_Goudy',serif] font-normal not-italic",
              "mt-3",
              "text-4xl",
              "italic",
              "leading-tight",
              "text-beecah-black",
              "sm:text-5xl",
            ].join(" ")}
          >
            {checkoutContent.suaSacolaEsta}{" "}
            <span className="font-haerins not-italic">{checkoutContent.vazia}</span>
          </h1>

          <p className="mt-4 max-w-sm text-sm leading-relaxed text-beecah-black/50">
            {checkoutContent.escolhaUmaFragranciaParaComecarSuaColecao}
          </p>

          <Link
            href="/perfumes"
            className="mt-8 inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-beecah-black px-7 text-xs font-medium uppercase text-beecah-white transition hover:bg-beecah-blue"
          >
            {checkoutContent.verPerfumes}
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-beecah-white px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto grid w-full max-w-7xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:gap-10">
        {/* SACOLA */}
        <div className="min-w-0 py-3 sm:py-5">
          {/* Cabeçalho */}
          <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1
                className={[
                  "font-['Sorts_Mill_Goudy',serif] font-normal not-italic",
                  "text-4xl",
                  "italic",
                  "leading-tight",
                  "tracking-tight",
                  "text-beecah-black",
                  "sm:text-5xl",
                  "lg:text-5xl",
                ].join(" ")}
              >
                {checkoutContent.tudoQueCabe}
                <br />
                {checkoutContent.naSua}{" "}
                <span className="font-haerins not-italic">{checkoutContent.sacola}</span>
              </h1>

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

            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="mb-1 flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-beecah-black"
            >
              {checkoutContent.limparLista}
              <Trash2 size={13} strokeWidth={1.7} />
            </button>
          </div>

          <p role="status" className="sr-only">
            {announcement}
          </p>
          {confirmClear && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-neutral-100 p-4">
              <p className="text-sm">{checkoutContent.removerTodosOsProdutosDaSacola}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="min-h-11 rounded-xl bg-white px-4 text-xs"
                >
                  {checkoutContent.manterProdutos}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    setConfirmClear(false);
                  }}
                  className="min-h-11 rounded-xl bg-beecah-black px-4 text-xs text-white"
                >
                  {checkoutContent.esvaziarSacola}
                </button>
              </div>
            </div>
          )}
          {/* Produtos */}
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="group grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 rounded-[22px] border border-neutral-100 bg-[#f7f7f5] p-3 transition duration-300 hover:border-neutral-300 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-5 sm:p-4"
              >
                {/* Imagem */}
                <Link
                  href={`/perfumes/${item.slug}`}
                  className="relative aspect-[4/5] self-start overflow-hidden rounded-2xl bg-white"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 88px, 144px"
                    className="object-contain p-3 transition duration-500 group-hover:scale-105"
                  />
                </Link>

                {/* Conteúdo */}
                <div className="flex min-w-0 flex-col justify-between py-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/perfumes/${item.slug}`}
                        className="line-clamp-2 text-sm font-medium text-beecah-black transition hover:text-beecah-blue sm:text-base"
                      >
                        {item.name}
                      </Link>

                      <p className="mt-1 text-xs text-beecah-black/45">
                        {item.quantity >= item.stock
                          ? checkoutContent.limiteDeEstoqueAtingido
                          : checkoutContent.perfume}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        removeItem(item.id);
                        setAnnouncement(item.name + checkoutContent.removidoDaSacola);
                      }}
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

                    <div className="ml-auto flex items-center gap-1 rounded-xl bg-white p-1">
                      <span className="order-2 min-w-7 text-center text-sm font-medium text-beecah-black">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label={`Diminuir quantidade de ${item.name}`}
                        className="order-1 flex size-11 items-center justify-center rounded-lg bg-beecah-black text-white transition hover:bg-beecah-blue disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Minus size={14} strokeWidth={1.8} />
                      </button>

                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        aria-label={`Aumentar quantidade de ${item.name}`}
                        className="order-3 flex size-11 items-center justify-center rounded-lg bg-beecah-black text-white transition hover:bg-beecah-blue disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Plus size={14} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <Link
            href="/perfumes"
            className="mt-5 inline-flex min-h-11 items-center gap-2 text-xs font-medium uppercase tracking-wide text-beecah-black/45 transition hover:text-beecah-black"
          >
            <span className="text-base">{"←"}</span>
            {checkoutContent.continuarComprando}
          </Link>
        </div>

        {/* RESUMO */}
        <aside className="relative rounded-[26px] bg-[#e7e7e7] p-4 sm:p-6 lg:sticky lg:top-28">
          <div className="mb-6 px-2">
            <div className="flex items-center gap-3">
              <span className="h-0.5 w-8 bg-beecah-black" />

              <p className="text-xs font-medium uppercase tracking-[0.35em] text-beecah-black/50">
                {checkoutContent.suaSelecao}
              </p>
            </div>

            <h2
              className={[
                "font-['Sorts_Mill_Goudy',serif] font-normal not-italic",
                "mt-5",
                "text-3xl",
                "italic",
                "text-beecah-black",
                "sm:text-4xl",
              ].join(" ")}
            >
              <span className="font-haerins not-italic">{checkoutContent.resumo}</span>{" "}
              {checkoutContent.daCompra}
            </h2>
          </div>

          <CheckoutSummary />
        </aside>
      </div>
    </section>
  );
}
