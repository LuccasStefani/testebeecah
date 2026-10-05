"use client";

import type { ProductType } from "@/src/content/product-types";
import { useFeedbackState } from "@/src/hooks/use-feedback-state";

import { notify } from "@/src/lib/notifications";
import { notificationContent } from "@/src/content/notifications";

import { catalogContent } from "@/src/content/catalog";
import { productStyles } from "@/src/styles/product";

import {
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  Check,
  LoaderCircle,
  ArrowRight,
} from "lucide-react";

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
    productType?: ProductType;
  };
};

export default function ProductActions({ product }: ProductActionsProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [actionError, setActionError] = useFeedbackState("error");

  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const { addItem, loading: cartLoading, updating: cartUpdating } = useCart();

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

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    setQuantity((current) => Math.min(stock, current + 1));
  }

  async function handleAddToCart() {
    if (adding || cartLoading || cartUpdating || isOutOfStock) return;
    setAdding(true);
    setAdded(false);
    setActionError("");
    try {
      const finalPrice = product.promoPrice ?? product.price;

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
        quantity,
      );
      setAdded(true);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : catalogContent.naoFoiPossivelAdicionarASacolaTenteNovamente,
      );
    } finally {
      setAdding(false);
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

  return (
    <div className={productStyles.productActions}>
      {!isOutOfStock && (
        <div className={productStyles.productQuantityRow}>
          <span>{catalogContent.quantidade}</span>
          <div className={productStyles.productStepper}>
            <button
              type="button"
              aria-label={catalogContent.diminuirQuantidade}
              onClick={decreaseQuantity}
              disabled={quantity <= 1 || adding}
            >
              <Minus size={16} />
            </button>
            <span aria-live="polite">{quantity}</span>
            <button
              type="button"
              aria-label={catalogContent.aumentarQuantidade}
              onClick={increaseQuantity}
              disabled={quantity >= stock || adding}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}
      <div className={productStyles.productPurchaseButtons}>
        <button
          type="button"
          disabled={isOutOfStock || adding || cartLoading || cartUpdating}
          onClick={handleAddToCart}
          className={productStyles.productAddButton}
        >
          {adding ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : added ? (
            <Check size={18} />
          ) : (
            <ShoppingBag size={18} strokeWidth={1.5} />
          )}
          <span>
            {isOutOfStock
              ? catalogContent.esgotado
              : adding
                ? catalogContent.adicionando
                : added
                  ? catalogContent.adicionadoASacola
                  : catalogContent.adicionarASacola}
          </span>
          {!adding && !added && !isOutOfStock && <ArrowRight size={17} />}
        </button>
        <button
          type="button"
          className={productStyles.productFavoriteButton}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? catalogContent.removerDosFavoritos
              : catalogContent.salvarNosFavoritos
          }
          onClick={handleFavorite}
          disabled={favoriteLoading}
        >
          {favoriteLoading ? (
            <LoaderCircle size={19} className="animate-spin" />
          ) : (
            <Heart
              size={21}
              strokeWidth={1.5}
              fill={isFavorite ? "currentColor" : "none"}
            />
          )}
        </button>
      </div>
      <p className={productStyles.productActionHint}>
        {catalogContent.toqueNoCoracaoParaGuardarSeuFavorito}
      </p>
      <p role="status" className={productStyles.productActionStatus}>
        {added ? catalogContent.produtoAdicionadoASuaSacola : ""}
      </p>
      {actionError && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {actionError}
        </p>
      )}
      {added && (
        <button
          type="button"
          onClick={() => router.push("/carrinho")}
          className={productStyles.productViewBag}
        >
          {catalogContent.verMinhaSacola}
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}
