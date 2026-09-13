"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/src/contexts/CartContext";
import {
  dispatchFavoriteUpdated,
  FAVORITES_UPDATED_EVENT,
} from "@/src/lib/favorites-events";
import { supabase } from "@/src/lib/supabase/client";

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
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] =
    useState(false);
  const [favoriteLoading, setFavoriteLoading] =
    useState(false);

  const { addItem } = useCart();

  const stock = product.stock;
  const isOutOfStock = stock <= 0;

  useEffect(() => {
    async function loadFavorite() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsFavorite(false);
        return;
      }

      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();

      if (error) {
        console.error(
          "Erro ao carregar favorito:",
          error
        );
        return;
      }

      setIsFavorite(Boolean(data));
    }

    loadFavorite();
  }, [product.id]);

  useEffect(() => {
    function handleFavoriteUpdated(
      event: Event
    ) {
      const customEvent =
        event as CustomEvent<{
          productId: string;
          isFavorite: boolean;
        }>;

      if (
        customEvent.detail.productId !==
        product.id
      ) {
        return;
      }

      setIsFavorite(
        customEvent.detail.isFavorite
      );
    }

    window.addEventListener(
      FAVORITES_UPDATED_EVENT,
      handleFavoriteUpdated
    );

    return () => {
      window.removeEventListener(
        FAVORITES_UPDATED_EVENT,
        handleFavoriteUpdated
      );
    };
  }, [product.id]);

  function decreaseQuantity() {
    setQuantity((current) =>
      Math.max(1, current - 1)
    );
  }

  function increaseQuantity() {
    setQuantity((current) =>
      Math.min(stock, current + 1)
    );
  }

  async function handleAddToCart() {
    const finalPrice =
      product.promoPrice ?? product.price;

    await addItem(
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

  async function handleFavorite() {
    if (favoriteLoading) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    try {
      setFavoriteLoading(true);

      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product.id);

        if (error) {
          console.error(
            "Erro ao remover favorito:",
            error
          );
          return;
        }

        setIsFavorite(false);

        dispatchFavoriteUpdated({
          productId: product.id,
          isFavorite: false,
        });

        return;
      }

      const { error } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          product_id: product.id,
        });

      if (error) {
        console.error(
          "Erro ao adicionar favorito:",
          error
        );
        return;
      }

      setIsFavorite(true);

      dispatchFavoriteUpdated({
        productId: product.id,
        isFavorite: true,
      });
    } finally {
      setFavoriteLoading(false);
    }
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
          onClick={handleFavorite}
          disabled={favoriteLoading}
          className="border border-neutral-300 px-6 py-4 text-sm font-medium transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isFavorite
            ? "♥ Favoritado"
            : "♡ Favoritar"}
        </button>
      </div>
    </div>
  );
}