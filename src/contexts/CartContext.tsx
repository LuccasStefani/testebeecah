"use client";
import { activePromoPrice } from "@/src/lib/promotions";

import { parseProductType, type ProductType } from "@/src/content/product-types";
import { notify } from "@/src/lib/notifications";
import { notificationContent } from "@/src/content/notifications";

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";

import { supabase } from "@/src/lib/supabase/client";

type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stock: number;
  productType?: ProductType;
};

type AddToCartProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  stock: number;
  productType?: ProductType;
};

type CartContextType = {
  items: CartItem[];
  loading: boolean;
  updating: boolean;
  loadError: string | null;
  retryLoad: () => void;
  addItem: (product: AddToCartProduct, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartProviderProps = {
  children: ReactNode;
};

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  const [loaded, setLoaded] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null | undefined>(undefined);
  const [updating, setUpdating] = useState(false);
  const mutationLock = useRef(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserId(user?.id ?? null);
    }

    void loadUser().catch(() => setUserId(null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (userId === undefined) {
      return;
    }

    let active = true;
    async function loadCart() {
      setLoadedFor(undefined);
      setLoaded(false);
      setLoadError(null);

      if (!userId) {
        const savedCart = localStorage.getItem("beecah-cart");

        if (savedCart) {
          try {
            const parsedCart: unknown = JSON.parse(savedCart);
            if (
              !Array.isArray(parsedCart) ||
              parsedCart.some(
                (item) =>
                  !item ||
                  typeof item.id !== "string" ||
                  typeof item.name !== "string" ||
                  typeof item.slug !== "string" ||
                  typeof item.imageUrl !== "string" ||
                  !Number.isFinite(item.price) ||
                  item.price < 0 ||
                  !Number.isInteger(item.stock) ||
                  item.stock < 0 ||
                  !Number.isInteger(item.quantity) ||
                  item.quantity < 1,
              )
            )
              throw new Error("Sacola inválida");

            setItems(parsedCart);
          } catch {
            localStorage.removeItem("beecah-cart");

            setItems([]);
          }
        } else {
          setItems([]);
        }

        setLoadedFor(userId);
        setLoaded(true);
        return;
      }

      const { data: cartItems, error: cartError } = await supabase
        .from("cart_items")
        .select(
          `
          product_id,
          quantity
        `,
        )
        .eq("user_id", userId);

      if (!active) return;
      if (cartError) {
        console.error("Erro ao carregar carrinho:", cartError);

        setItems([]);
        setLoadError("Não foi possível carregar sua sacola. Tente novamente.");
        setLoaded(true);
        return;
      }

      let guestItems: CartItem[] = [];
      try {
        const saved: unknown = JSON.parse(localStorage.getItem("beecah-cart") ?? "[]");
        if (Array.isArray(saved))
          guestItems = saved.filter(
            (item) =>
              item &&
              typeof item.id === "string" &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0,
          );
      } catch {
        /* A malformed guest cart must not block the account cart. */
      }
      const productIds = [
        ...new Set([
          ...(cartItems?.map((item) => item.product_id) ?? []),
          ...guestItems.map((item) => item.id),
        ]),
      ];

      if (productIds.length === 0) {
        setLoadedFor(userId);
        setItems([]);
        setLoaded(true);
        return;
      }

      const { data: products, error: productsError } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          slug,
          price,
          promo_price,promo_ends_on,
          stock,
          product_type,
          active,
          product_images (
            image_url,
            position,
            is_cover
          )
        `,
        )
        .in("id", productIds)
        .eq("active", true);

      if (!active) return;
      if (productsError) {
        console.error("Erro ao carregar produtos do carrinho:", productsError);

        setItems([]);
        setLoadError("Não foi possível carregar sua sacola. Tente novamente.");
        setLoaded(true);
        return;
      }

      const loadedItems: CartItem[] =
        products?.map((product) => {
          const cartItem = cartItems?.find((item) => item.product_id === product.id);

          const images = product.product_images ?? [];

          const sortedImages = [...images].sort((a, b) => {
            if (a.is_cover && !b.is_cover) {
              return -1;
            }

            if (!a.is_cover && b.is_cover) {
              return 1;
            }

            return a.position - b.position;
          });

          const finalPrice = activePromoPrice(product) ?? Number(product.price);

          return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: finalPrice,
            imageUrl: sortedImages[0]?.image_url ?? "",
            quantity: Math.min(
              (cartItem?.quantity ?? 0) +
                (guestItems.find((item) => item.id === product.id)?.quantity ?? 0),
              product.stock,
            ),
            stock: product.stock,
            productType: parseProductType(product.product_type),
          };
        }) ?? [];

      if (guestItems.length > 0) {
        const merged = loadedItems.filter(
          (item) => item.quantity > 0 && guestItems.some((guest) => guest.id === item.id),
        );
        if (merged.length > 0) {
          const { error } = await supabase.from("cart_items").upsert(
            merged.map((item) => ({
              user_id: userId,
              product_id: item.id,
              quantity: item.quantity,
              updated_at: new Date().toISOString(),
            })),
            { onConflict: "user_id,product_id" },
          );
          if (error)
            throw new Error("Não foi possível recuperar a sacola. Tente novamente.");
        }
        localStorage.removeItem("beecah-cart");
      }
      if (!active) return;
      setLoadedFor(userId);
      setItems(loadedItems);
      setLoaded(true);
    }

    void loadCart().catch(() => {
      if (!active) return;
      setLoadError("Não foi possível carregar sua sacola. Tente novamente.");
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [userId, loadAttempt]);

  useEffect(() => {
    if (!loaded || userId !== null || loadedFor !== userId) {
      return;
    }

    localStorage.setItem("beecah-cart", JSON.stringify(items));
  }, [items, loaded, userId, loadedFor]);

  async function addItemInternal(product: AddToCartProduct, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1)
      throw new Error("Quantidade inválida.");
    if (product.stock <= 0) {
      throw new Error(notificationContent.outOfStock);
    }

    const existingItem = items.find((item) => item.id === product.id);

    const newQuantity = Math.min((existingItem?.quantity ?? 0) + quantity, product.stock);
    if (existingItem && newQuantity === existingItem.quantity) {
      throw new Error(notificationContent.stockLimit);
    }

    if (userId) {
      const { error } = await supabase.from("cart_items").upsert(
        {
          user_id: userId,
          product_id: product.id,
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,product_id",
        },
      );

      if (error) {
        console.error("Erro ao adicionar ao carrinho:", error);
        throw new Error(notificationContent.cartError);
      }
    }

    setItems((currentItems) => {
      const currentItem = currentItems.find((item) => item.id === product.id);

      if (currentItem) {
        return currentItems.map((item) => {
          if (item.id !== product.id) {
            return item;
          }

          return {
            ...item,
            quantity: newQuantity,
          };
        });
      }

      return [
        ...currentItems,
        {
          ...product,
          quantity: newQuantity,
        },
      ];
    });
    notify.success(notificationContent.cartAdded, product.name, "bag");
  }

  async function removeItemInternal(productId: string) {
    if (userId) {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId);

      if (error) {
        console.error("Erro ao remover item do carrinho:", error);
        throw new Error(notificationContent.cartError);
      }
    }

    setItems((currentItems) => currentItems.filter((item) => item.id !== productId));
    notify.success(notificationContent.cartRemoved, undefined, "bag");
  }

  async function updateQuantityInternal(productId: string, quantity: number) {
    const item = items.find((currentItem) => currentItem.id === productId);

    if (!item) {
      return;
    }

    if (item.stock <= 0) throw new Error(notificationContent.outOfStock);
    if (!Number.isInteger(quantity)) throw new Error("Quantidade inválida.");
    const newQuantity = Math.max(1, Math.min(quantity, item.stock));
    if (newQuantity === item.quantity) return;

    if (userId) {
      const { error } = await supabase
        .from("cart_items")
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("product_id", productId);

      if (error) {
        console.error("Erro ao atualizar quantidade:", error);
        throw new Error(notificationContent.cartError);
      }
    }

    setItems((currentItems) =>
      currentItems.map((currentItem) => {
        if (currentItem.id !== productId) {
          return currentItem;
        }

        return {
          ...currentItem,
          quantity: newQuantity,
        };
      }),
    );
    if (newQuantity !== item.quantity)
      notify.success(notificationContent.cartUpdated, item.name, "bag");
  }

  async function clearCartInternal() {
    if (userId) {
      const { error } = await supabase.from("cart_items").delete().eq("user_id", userId);

      if (error) {
        console.error("Erro ao limpar carrinho:", error);
        throw new Error(notificationContent.cartError);
      }
    }

    setItems([]);
    notify.success(notificationContent.cartCleared, undefined, "bag");
  }

  async function mutate(action: () => Promise<void>) {
    if (!loaded || loadError) throw new Error("Aguarde o carregamento da sacola.");
    if (mutationLock.current) throw new Error("Aguarde a atualização da sacola.");
    mutationLock.current = true;
    setUpdating(true);
    try {
      await action();
    } finally {
      mutationLock.current = false;
      setUpdating(false);
    }
  }

  const addItem = (product: AddToCartProduct, quantity: number) =>
    mutate(() => addItemInternal(product, quantity));
  const removeItem = (id: string) => mutate(() => removeItemInternal(id));
  const updateQuantity = (id: string, quantity: number) =>
    mutate(() => updateQuantityInternal(id, quantity));
  const clearCart = () => mutate(clearCartInternal);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading: !loadError && (!loaded || userId === undefined || loadedFor !== userId),
        updating,
        loadError,
        retryLoad: () => setLoadAttempt((attempt) => attempt + 1),
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart precisa estar dentro de CartProvider");
  }

  return context;
}
