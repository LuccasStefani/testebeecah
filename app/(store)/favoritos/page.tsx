import { redirect } from "next/navigation";

import FavoritesGrid from "@/src/components/products/FavoritesGrid";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { Product } from "@/src/types/product";

export default async function FavoritosPage() {
  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: favorites,
    error: favoritesError,
  } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", user.id);

  if (favoritesError) {
    console.error(
      "Erro ao carregar favoritos:",
      favoritesError
    );
  }

  const productIds =
    favorites?.map(
      (favorite) => favorite.product_id
    ) ?? [];

  let products: Product[] = [];

  if (productIds.length > 0) {
    const {
      data: productsData,
      error: productsError,
    } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        brand,
        description,
        price,
        promo_price,
        stock,
        category,
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
        "Erro ao carregar produtos favoritos:",
        productsError
      );
    }

    products =
      productsData?.map((product) => {
        const images =
          product.product_images ?? [];

        const sortedImages = [...images].sort(
          (a, b) => {
            if (a.is_cover && !b.is_cover) {
              return -1;
            }

            if (!a.is_cover && b.is_cover) {
              return 1;
            }

            return a.position - b.position;
          }
        );

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          brand: product.brand,
          description: product.description,
          price: Number(product.price),
          promoPrice:
            product.promo_price !== null
              ? Number(product.promo_price)
              : undefined,
          stock: product.stock,
          category: product.category,
          imageUrl:
            sortedImages[0]?.image_url ?? "",
        };
      }) ?? [];
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Minha conta
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Meus favoritos
        </h1>

        <p className="mt-2 text-neutral-500">
          Perfumes que você salvou para ver depois.
        </p>
      </div>

      <FavoritesGrid initialProducts={products} />
    </section>
  );
}