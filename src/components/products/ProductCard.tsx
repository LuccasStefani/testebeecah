"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/src/contexts/CartContext";
import {
  dispatchFavoriteUpdated,
  FAVORITES_UPDATED_EVENT,
} from "@/src/lib/favorites-events";
import { supabase } from "@/src/lib/supabase/client";
import { Product } from "@/src/types/product";

type ProductCardProps = {
  product: Product;
  onFavoriteRemoved?: (
    productId: string
  ) => void;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function ProductCard({
  product,
  onFavoriteRemoved,
}: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const [isFavorite, setIsFavorite] =
    useState(false);

  const [
    favoriteLoading,
    setFavoriteLoading,
  ] = useState(false);

  const [
    cartLoading,
    setCartLoading,
  ] = useState(false);

  const [
    addedToCart,
    setAddedToCart,
  ] = useState(false);

  const hasPromotion =
    product.promoPrice !== undefined &&
    product.promoPrice < product.price;

  const finalPrice = hasPromotion
    ? product.promoPrice!
    : product.price;

  const isOutOfStock =
    product.stock <= 0;

  useEffect(() => {
    async function loadFavorite() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsFavorite(false);
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq(
          "product_id",
          product.id
        )
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

  async function handleAddToCart() {
    if (
      isOutOfStock ||
      cartLoading
    ) {
      return;
    }

    try {
      setCartLoading(true);

      await addItem(
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: finalPrice,
          imageUrl: product.imageUrl,
          stock: product.stock,
        },
        1
      );

      setAddedToCart(true);

      window.setTimeout(() => {
        setAddedToCart(false);
      }, 1500);
    } finally {
      setCartLoading(false);
    }
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
        const { error } =
          await supabase
            .from("favorites")
            .delete()
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "product_id",
              product.id
            );

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

        onFavoriteRemoved?.(
          product.id
        );

        return;
      }

      const { error } =
        await supabase
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
    <article className="group overflow-hidden border border-neutral-200 bg-white">
      <Link
        href={`/perfumes/${product.slug}`}
      >
        <div className="relative aspect-square overflow-hidden bg-neutral-100">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain p-6 transition duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {hasPromotion && (
            <span className="absolute left-3 top-3 bg-black px-3 py-1.5 text-xs font-medium text-white">
              Oferta
            </span>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <span className="bg-neutral-950 px-4 py-2 text-xs font-medium uppercase tracking-wider text-white">
                Esgotado
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <span className="text-xs uppercase tracking-wider text-neutral-500">
          {product.brand}
        </span>

        <Link
          href={`/perfumes/${product.slug}`}
        >
          <h2 className="mt-1 text-base font-medium text-neutral-950 transition hover:text-neutral-600">
            {product.name}
          </h2>
        </Link>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">
          {product.description}
        </p>

        <div className="mt-4">
          {hasPromotion && (
            <span className="mr-2 text-sm text-neutral-400 line-through">
              {formatPrice(
                product.price
              )}
            </span>
          )}

          <span className="text-lg font-semibold">
            {formatPrice(
              finalPrice
            )}
          </span>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={
              isOutOfStock ||
              cartLoading
            }
            className="flex-1 bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {isOutOfStock
              ? "Esgotado"
              : cartLoading
                ? "Adicionando..."
                : addedToCart
                  ? "Adicionado ✓"
                  : "Adicionar"}
          </button>

          <button
            type="button"
            onClick={
              handleFavorite
            }
            disabled={
              favoriteLoading
            }
            aria-label={
              isFavorite
                ? `Remover ${product.name} dos favoritos`
                : `Favoritar ${product.name}`
            }
            className="min-w-12 border border-neutral-300 px-4 text-xl transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFavorite
              ? "♥"
              : "♡"}
          </button>
        </div>
      </div>
    </article>
  );
}