"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/src/lib/supabase/client";

type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stock: number;
};

type AddToCartProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  stock: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (
    product: AddToCartProduct,
    quantity: number
  ) => Promise<void>;
  removeItem: (
    productId: string
  ) => Promise<void>;
  updateQuantity: (
    productId: string,
    quantity: number
  ) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<
  CartContextType | undefined
>(undefined);

type CartProviderProps = {
  children: ReactNode;
};

export function CartProvider({
  children,
}: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>(
    []
  );

  const [userId, setUserId] = useState<
    string | null | undefined
  >(undefined);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserId(user?.id ?? null);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user.id ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (userId === undefined) {
      return;
    }

    async function loadCart() {
      setLoaded(false);

      if (!userId) {
        const savedCart =
          localStorage.getItem("beecah-cart");

        if (savedCart) {
          try {
            const parsedCart =
              JSON.parse(savedCart);

            setItems(parsedCart);
          } catch {
            localStorage.removeItem(
              "beecah-cart"
            );

            setItems([]);
          }
        } else {
          setItems([]);
        }

        setLoaded(true);
        return;
      }

      const {
        data: cartItems,
        error: cartError,
      } = await supabase
        .from("cart_items")
        .select(`
          product_id,
          quantity
        `)
        .eq("user_id", userId);

      if (cartError) {
        console.error(
          "Erro ao carregar carrinho:",
          cartError
        );

        setItems([]);
        setLoaded(true);
        return;
      }

      const productIds =
        cartItems?.map(
          (item) => item.product_id
        ) ?? [];

      if (productIds.length === 0) {
        setItems([]);
        setLoaded(true);
        return;
      }

      const {
        data: products,
        error: productsError,
      } = await supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          price,
          promo_price,
          stock,
          active,
          product_images (
            image_url,
            position,
            is_cover
          )
        `)
        .in("id", productIds)
        .eq("active", true);

      if (productsError) {
        console.error(
          "Erro ao carregar produtos do carrinho:",
          productsError
        );

        setItems([]);
        setLoaded(true);
        return;
      }

      const loadedItems: CartItem[] =
        products?.map((product) => {
          const cartItem =
            cartItems?.find(
              (item) =>
                item.product_id === product.id
            );

          const images =
            product.product_images ?? [];

          const sortedImages = [...images].sort(
            (a, b) => {
              if (
                a.is_cover &&
                !b.is_cover
              ) {
                return -1;
              }

              if (
                !a.is_cover &&
                b.is_cover
              ) {
                return 1;
              }

              return (
                a.position - b.position
              );
            }
          );

          const finalPrice =
            product.promo_price !== null
              ? Number(product.promo_price)
              : Number(product.price);

          return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: finalPrice,
            imageUrl:
              sortedImages[0]?.image_url ??
              "",
            quantity: Math.min(
              cartItem?.quantity ?? 1,
              product.stock
            ),
            stock: product.stock,
          };
        }) ?? [];

      setItems(loadedItems);
      setLoaded(true);
    }

    loadCart();
  }, [userId]);

  useEffect(() => {
    if (
      !loaded ||
      userId !== null
    ) {
      return;
    }

    localStorage.setItem(
      "beecah-cart",
      JSON.stringify(items)
    );
  }, [items, loaded, userId]);

  async function addItem(
    product: AddToCartProduct,
    quantity: number
  ) {
    if (product.stock <= 0) {
      return;
    }

    const existingItem = items.find(
      (item) => item.id === product.id
    );

    const newQuantity = Math.min(
      (existingItem?.quantity ?? 0) +
        quantity,
      product.stock
    );

    if (userId) {
      const { error } = await supabase
        .from("cart_items")
        .upsert(
          {
            user_id: userId,
            product_id: product.id,
            quantity: newQuantity,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "user_id,product_id",
          }
        );

      if (error) {
        console.error(
          "Erro ao adicionar ao carrinho:",
          error
        );

        return;
      }
    }

    setItems((currentItems) => {
      const currentItem =
        currentItems.find(
          (item) =>
            item.id === product.id
        );

      if (currentItem) {
        return currentItems.map(
          (item) => {
            if (
              item.id !== product.id
            ) {
              return item;
            }

            return {
              ...item,
              quantity: newQuantity,
            };
          }
        );
      }

      return [
        ...currentItems,
        {
          ...product,
          quantity: newQuantity,
        },
      ];
    });
  }

  async function removeItem(
    productId: string
  ) {
    if (userId) {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId);

      if (error) {
        console.error(
          "Erro ao remover item do carrinho:",
          error
        );

        return;
      }
    }

    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== productId
      )
    );
  }

  async function updateQuantity(
    productId: string,
    quantity: number
  ) {
    const item = items.find(
      (currentItem) =>
        currentItem.id === productId
    );

    if (!item) {
      return;
    }

    const newQuantity = Math.max(
      1,
      Math.min(quantity, item.stock)
    );

    if (userId) {
      const { error } = await supabase
        .from("cart_items")
        .update({
          quantity: newQuantity,
          updated_at:
            new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("product_id", productId);

      if (error) {
        console.error(
          "Erro ao atualizar quantidade:",
          error
        );

        return;
      }
    }

    setItems((currentItems) =>
      currentItems.map(
        (currentItem) => {
          if (
            currentItem.id !== productId
          ) {
            return currentItem;
          }

          return {
            ...currentItem,
            quantity: newQuantity,
          };
        }
      )
    );
  }

  async function clearCart() {
    if (userId) {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userId);

      if (error) {
        console.error(
          "Erro ao limpar carrinho:",
          error
        );

        return;
      }
    }

    setItems([]);
  }

  const totalItems = items.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  const totalPrice = items.reduce(
    (total, item) =>
      total +
      item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
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
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart precisa estar dentro de CartProvider"
    );
  }

  return context;
}