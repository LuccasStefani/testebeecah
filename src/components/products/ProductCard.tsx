"use client";
import { productTypeLabel } from "@/src/content/product-types";

import { useFeedbackState } from "@/src/hooks/use-feedback-state";

import { notify } from "@/src/lib/notifications";
import { notificationContent } from "@/src/content/notifications";

import { showcaseContent } from "@/src/content/showcase";

import { catalogContent } from "@/src/content/catalog";
import Image from "next/image";
import Link from "next/link";
import { Award, Check, Heart, LoaderCircle, Plus, ShoppingBag } from "lucide-react";
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
  showcase?: boolean;
  bestSeller?: boolean;
  onFavoriteRemoved?: (productId: string) => void;
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
  showcase = false,
  bestSeller = false,
}: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const [actionError, setActionError] = useFeedbackState("error");

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
          productType: product.productType,
        },
        1,
      );

      setAddedToCart(true);

      window.setTimeout(() => {
        setAddedToCart(false);
      }, 1500);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : catalogContent.naoFoiPossivelAdicionarASacolaTenteNovamente,
      );
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
      notify.info(notificationContent.loginRequired, undefined, "heart");
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
          notify.error(notificationContent.favoriteError);
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
        notify.error(notificationContent.favoriteError);
        return;
      }

      setIsFavorite(true);

      dispatchFavoriteUpdated({
        productId: product.id,
        isFavorite: true,
      });
    } catch {
      notify.error(notificationContent.favoriteError);
    } finally {
      setFavoriteLoading(false);
    }
  }

  const discount =
    hasPromotion && product.price > 0
      ? Math.round((1 - finalPrice / product.price) * 100)
      : 0;

  const favoriteButton = (
    <button
      type="button"
      onClick={handleFavorite}
      disabled={favoriteLoading}
      aria-pressed={isFavorite}
      aria-label={
        isFavorite ? `Remover ${product.name} dos favoritos` : `Favoritar ${product.name}`
      }
      className={
        showcase
          ? "flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#171914] text-white transition hover:bg-neutral-700 disabled:opacity-50"
          : "absolute right-2 top-2 flex size-11 items-center justify-center rounded-full bg-white/90 text-beecah-black backdrop-blur-sm transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
      }
    >
      {favoriteLoading ? (
        <LoaderCircle size={17} className="animate-spin" />
      ) : (
        <Heart size={19} strokeWidth={1.4} fill={isFavorite ? "currentColor" : "none"} />
      )}
    </button>
  );

  return (
    <article className="group/card relative flex h-full w-full min-w-0 flex-col">
      <div
        className={
          "relative isolate shrink-0 overflow-hidden rounded-2xl bg-[#f3f2f0] " +
          (showcase ? "aspect-[5/6]" : "aspect-[4/5]")
        }
      >
        <Link
          href={`/perfumes/${product.slug}`}
          className="block h-full"
          aria-label={`Ver ${product.name}`}
        >
          <Image
            src={product.imageUrl || "/images/products/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover/card:scale-[1.035] motion-reduce:transform-none motion-reduce:transition-none"
            sizes={
              showcase
                ? "(max-width: 640px) 220px, (max-width: 1024px) 240px, 260px"
                : "(max-width: 640px) 47vw, (max-width: 1024px) 46vw, 25vw"
            }
          />
        </Link>
        {bestSeller && (
          <span
            className={`pointer-events-none absolute left-2.5 ${isOutOfStock ? "bottom-14" : "bottom-3"} inline-flex items-center gap-2 rounded-xl border border-[#F2DC8D] bg-[#F2DC8D] px-3 py-2 text-xs font-semibold text-[#30250D] shadow-[0_3px_12px_#00000030]`}
          >
            <Award size={18} strokeWidth={2} aria-hidden="true" />
            {showcaseContent.bestSellerBadge}
          </span>
        )}
        {discount > 0 && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-white px-2.5 py-1.5 text-[10px] font-semibold tracking-wide sm:left-3 sm:top-3">
            {"−"}
            {discount}
            {"%"}
          </span>
        )}
        {!showcase && favoriteButton}
        {isOutOfStock && (
          <span className="pointer-events-none absolute inset-x-2 bottom-2 rounded-lg bg-white/95 py-2.5 text-center text-[10px] font-medium uppercase tracking-wider">
            {catalogContent.esgotado}
          </span>
        )}
      </div>
      <div className={"flex flex-1 flex-col " + (showcase ? "pt-2" : "pt-4")}>
        <div className="flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.12em] text-neutral-500 sm:text-[10px]">
          <span className="truncate">{product.brand}</span>
          {showcase && product.category ? (
            <span
              className={
                "inline-flex min-h-7 min-w-20 shrink-0 items-center justify-center rounded-xl px-3 py-1 text-xs font-medium normal-case leading-5 tracking-normal text-[#171914] " +
                (product.category === "Feminino"
                  ? "bg-[#DCA7E5]"
                  : product.category === "Masculino"
                    ? "bg-[#E6DBA8]"
                    : "bg-[#B1E5A5]")
              }
            >
              {product.category}
            </span>
          ) : (
            product.volume && (
              <span className="shrink-0 tracking-normal">{product.volume}</span>
            )
          )}
        </div>
        <Link href={`/perfumes/${product.slug}`} className="mt-1.5 block">
          <h3
            className={
              "line-clamp-2 min-h-10 text-[15px] font-medium leading-5 tracking-tight group-hover/card:underline group-hover/card:decoration-neutral-300 group-hover/card:underline-offset-4 " +
              (!showcase ? "sm:min-h-12 sm:text-lg sm:leading-6" : "")
            }
          >
            {product.name}
          </h3>
        </Link>
        {showcase && (
          <div className="mt-1 flex flex-col gap-1">
            <p
              className="min-h-5 truncate text-xs leading-5 text-neutral-600"
              title={[product.volume, product.fragranceFamily]
                .filter(Boolean)
                .join(" · ")}
            >
              {[product.volume, product.fragranceFamily].filter(Boolean).join(" · ")}
            </p>
            <div className="flex min-h-6 items-center gap-2 text-[10px] font-medium">
              {product.productType && product.productType !== "perfume" && (
                <span className="rounded-full bg-[#eceaf1] px-2.5 py-1 text-[#2d416f]">
                  {productTypeLabel(product.productType)}
                </span>
              )}
              {product.isArabian && (
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-700">
                  {showcaseContent.arabian}
                </span>
              )}
              {product.isNew && (
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-700">
                  {showcaseContent.newProduct}
                </span>
              )}
            </div>
          </div>
        )}
        {!showcase && (
          <p className="mt-1 truncate text-[11px] text-neutral-500 sm:text-xs">
            {[
              productTypeLabel(product.productType),
              product.category,
              product.fragranceFamily,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        <div
          className={
            "mt-auto flex items-end justify-between gap-2 " + (showcase ? "pt-1" : "pt-4")
          }
        >
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
          <div className="flex shrink-0 gap-2">
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
              ) : showcase ? (
                <ShoppingBag size={18} strokeWidth={1.5} />
              ) : (
                <Plus size={20} strokeWidth={1.5} />
              )}
            </button>
            {showcase && favoriteButton}
          </div>
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
