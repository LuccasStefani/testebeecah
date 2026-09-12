"use client";
import { useCart } from "@/src/contexts/CartContext";

import { useState } from "react";

type ProductActionsProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    promoPrice?: number;
    imageUrl: string;
    stock: number;
  };
};

export default function ProductActions({
  product,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);

  const { addItem } = useCart();

  const stock = product.stock;

  const isOutOfStock = stock <= 0;

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    setQuantity((current) => Math.min(stock, current + 1));
  }

  function handleAddToCart() {
  const finalPrice =
    product.promoPrice ?? product.price;

  addItem(
    {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: finalPrice,
      imageUrl: product.imageUrl,
      stock: product.stock,
    },
    quantity
  );
}

  return (
    <div className="mt-10">
      {!isOutOfStock && (
        <div>
          <span className="text-sm font-medium">
            Quantidade
          </span>

          <div className="mt-3 inline-flex items-center border border-neutral-300">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              className="h-12 w-12 text-lg transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
            >
              −
            </button>

            <span className="flex h-12 min-w-14 items-center justify-center border-x border-neutral-300 text-sm font-medium">
              {quantity}
            </span>

            <button
              type="button"
              onClick={increaseQuantity}
              disabled={quantity >= stock}
              className="h-12 w-12 text-lg transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
            >
              +
            </button>
          </div>

          <p className="mt-2 text-xs text-neutral-500">
            {stock} unidades disponíveis
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className="flex-1 bg-neutral-950 px-6 py-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {isOutOfStock
            ? "Esgotado"
            : "Adicionar ao carrinho"}
        </button>

        <button
          type="button"
          className="border border-neutral-300 px-6 py-4 text-sm font-medium transition hover:bg-neutral-100"
        >
          ♡ Favoritar
        </button>
      </div>
    </div>
  );
}