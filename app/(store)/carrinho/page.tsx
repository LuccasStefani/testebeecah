"use client";

import Image from "next/image";
import Link from "next/link";

import CheckoutSummary from "@/src/components/checkout/CheckoutSummary";
import { useCart } from "@/src/contexts/CartContext";

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-3xl font-semibold">
            Seu carrinho está vazio
          </h1>

          <p className="mt-4 text-neutral-600">
            Adicione alguns perfumes para continuar sua compra.
          </p>

          <Link
            href="/perfumes"
            className="mt-8 inline-block bg-neutral-950 px-6 py-4 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Ver perfumes
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">
            Carrinho
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Revise seus produtos, endereço e entrega antes de finalizar.
          </p>
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="text-sm text-neutral-500 underline underline-offset-4 transition hover:text-neutral-950"
        >
          Limpar carrinho
        </button>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="grid gap-5 border-b border-neutral-200 pb-6 sm:grid-cols-[140px_1fr]"
            >
              <Link
                href={`/perfumes/${item.slug}`}
                className="relative aspect-square overflow-hidden bg-neutral-100"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-contain p-4"
                  sizes="140px"
                />
              </Link>

              <div className="flex flex-col justify-between gap-5">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link
                      href={`/perfumes/${item.slug}`}
                      className="text-lg font-medium hover:underline"
                    >
                      {item.name}
                    </Link>

                    <p className="mt-2 text-sm text-neutral-500">
                      {formatPrice(item.price)} cada
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeItem(item.id)
                    }
                    className="h-fit text-sm text-neutral-500 transition hover:text-red-600"
                  >
                    Remover
                  </button>
                </div>

                <div className="flex flex-wrap items-end justify-between gap-5">
                  <div>
                    <p className="mb-2 text-xs font-medium text-neutral-500">
                      Quantidade
                    </p>

                    <div className="inline-flex items-center border border-neutral-300">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity - 1
                          )
                        }
                        disabled={item.quantity <= 1}
                        className="h-10 w-10 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
                      >
                        −
                      </button>

                      <span className="flex h-10 min-w-12 items-center justify-center border-x border-neutral-300 text-sm">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity + 1
                          )
                        }
                        disabled={
                          item.quantity >=
                          item.stock
                        }
                        className="h-10 w-10 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <p className="text-lg font-semibold">
                    {formatPrice(
                      item.price *
                        item.quantity
                    )}
                  </p>
                </div>
              </div>
            </article>
          ))}

          <Link
            href="/perfumes"
            className="inline-block pt-2 text-sm text-neutral-500 underline underline-offset-4 hover:text-neutral-950"
          >
            Continuar comprando
          </Link>
        </div>

        <CheckoutSummary />
      </div>
    </section>
  );
}