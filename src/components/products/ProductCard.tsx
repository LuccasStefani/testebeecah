"use client";

import { catalogContent } from "@/src/content/catalog";
import Image from "next/image";
import Link from "next/link";
import { Check, Heart, LoaderCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";
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
  onFavoriteRemoved?: (productId: string) => void;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function ProductCard({ product, onFavoriteRemoved }: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const [actionError, setActionError] = useState("");

  const [isFavorite, setIsFavorite] = useState(false);

  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [cartLoading, setCartLoading] = useState(false);

  const [addedToCart, setAddedToCart] = useState(false);

  const hasPromotion =
    product.promoPrice !== undefined && product.promoPrice < product.price;

  const finalPrice = hasPromotion ? product.promoPrice! : product.price;

  const isOutOfStock = product.stock <= 0;

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
        console.error(catalogContent.erroAoCarregarFavorito, error);
        return;
      }

      setIsFavorite(Boolean(data));
    }

    loadFavorite();
  }, [product.id]);

  useEffect(() => {
    function handleFavoriteUpdated(event: Event) {
      const customEvent = event as CustomEvent<{
        productId: string;
        isFavorite: boolean;
      }>;

      if (customEvent.detail.productId !== product.id) {
        return;
      }

      setIsFavorite(customEvent.detail.isFavorite);
    }

    window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavoriteUpdated);

    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavoriteUpdated);
    };
  }, [product.id]);

  async function handleAddToCart() {
    if (isOutOfStock || cartLoading) {
      return;
    }

    try {
      setCartLoading(true);
      setActionError("");

      await addItem(
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: finalPrice,
          imageUrl: product.imageUrl,
          stock: product.stock,
        },
        1,
      );

      setAddedToCart(true);

      window.setTimeout(() => {
        setAddedToCart(false);
      }, 1500);
    } catch {
      setActionError(catalogContent.naoFoiPossivelAdicionarASacolaTenteNovamente);
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
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product.id);

        if (error) {
          console.error(catalogContent.erroAoRemoverFavorito, error);
          return;
        }

        setIsFavorite(false);

        dispatchFavoriteUpdated({
          productId: product.id,
          isFavorite: false,
        });

        onFavoriteRemoved?.(product.id);

        return;
      }

      const { error } = await supabase.from("favorites").insert({
        user_id: user.id,
        product_id: product.id,
      });

      if (error) {
        console.error(catalogContent.erroAoAdicionarFavorito, error);
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

  const discount =
    hasPromotion && product.price > 0
      ? Math.round((1 - finalPrice / product.price) * 100)
      : 0;

  return (
    <article className="group/card flex h-full min-w-0 flex-col">
      <div className="relative isolate aspect-[4/5] overflow-hidden rounded-2xl bg-[#f3f2f0]">
        <Link
          href={`/perfumes/${product.slug}`}
          className="block h-full"
          aria-label={`Ver ${product.name}`}
        >
          <Image
            src={product.imageUrl || "/images/products/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover/card:scale-[1.035]"
            sizes="(max-width: 640px) 47vw, (max-width: 1024px) 46vw, 25vw"
          />
        </Link>
        {discount > 0 && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-white px-2.5 py-1.5 text-[10px] font-semibold tracking-wide sm:left-3 sm:top-3">
            {"−"}
            {discount}
            {"%"}
          </span>
        )}
        <button
          type="button"
          onClick={handleFavorite}
          disabled={favoriteLoading}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? `Remover ${product.name} dos favoritos`
              : `Favoritar ${product.name}`
          }
          className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-full bg-white/90 text-beecah-black backdrop-blur-sm transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
        >
          {favoriteLoading ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Heart
              size={19}
              strokeWidth={1.4}
              fill={isFavorite ? "currentColor" : "none"}
            />
          )}
        </button>
        {isOutOfStock && (
          <span className="pointer-events-none absolute inset-x-2 bottom-2 rounded-lg bg-white/95 py-2.5 text-center text-[10px] font-medium uppercase tracking-wider">
            {catalogContent.esgotado}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.12em] text-neutral-500 sm:text-[10px]">
          <span className="truncate">{product.brand}</span>
          {product.volume && (
            <span className="shrink-0 tracking-normal">{product.volume}</span>
          )}
        </div>
        <Link href={`/perfumes/${product.slug}`} className="mt-1.5 block">
          <h3 className="line-clamp-2 min-h-10 text-[15px] font-medium leading-5 tracking-tight sm:min-h-12 sm:text-lg sm:leading-6 group-hover/card:underline group-hover/card:decoration-neutral-300 group-hover/card:underline-offset-4">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 truncate text-[11px] text-neutral-500 sm:text-xs">
          {[product.category, product.fragranceFamily].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="min-w-0">
            <p className="min-h-4 text-[10px] text-neutral-400 sm:text-xs">
              {hasPromotion ? (
                <>
                  <span className="sr-only">{catalogContent.de}</span>
                  <span className="line-through">{formatPrice(product.price)}</span>
                </>
              ) : null}
            </p>
            <p className="mt-0.5 text-base font-semibold tracking-tight sm:text-xl">
              {formatPrice(finalPrice)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || cartLoading}
            aria-label={
              isOutOfStock
                ? product.name + " esgotado"
                : "Adicionar " + product.name + catalogContent.aSacola
            }
            title={catalogContent.adicionarASacola}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-beecah-black text-white transition hover:bg-beecah-blue disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {cartLoading ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : addedToCart ? (
              <Check size={19} />
            ) : (
              <Plus size={20} strokeWidth={1.5} />
            )}
          </button>
        </div>
        <span role="status" className="sr-only">
          {addedToCart ? product.name + catalogContent.adicionadoASacola2 : ""}
        </span>
        {actionError && (
          <p role="alert" className="mt-3 text-xs text-red-700">
            {actionError}
          </p>
        )}
      </div>
    </article>
  );
}
