import { parseProductType } from "@/src/content/product-types";
import PersonalPageHero from "@/src/components/layout/PersonalPageHero";
import { catalogContent } from "@/src/content/catalog";
import { redirect } from "next/navigation";

import FavoritesGrid from "@/src/components/products/FavoritesGrid";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { Product } from "@/src/types/product";

export default async function FavoritosPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: favorites, error: favoritesError } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", user.id);

  if (favoritesError) {
    console.error(catalogContent.erroAoCarregarFavoritos, favoritesError);
  }

  const productIds = favorites?.map((favorite) => favorite.product_id) ?? [];

  let products: Product[] = [];

  if (productIds.length > 0) {
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select(
        "\n        id,\n        name,\n        slug,\n        brand,\n        description,\n        price,\n        promo_price,\n        stock,\n        category,\n          product_type,\n        product_images (\n          image_url,\n          position,\n          is_cover\n        )\n      ",
      )
      .in("id", productIds)
      .eq("active", true);

    if (productsError) {
      console.error(catalogContent.erroAoCarregarProdutosFavoritos, productsError);
    }

    products =
      productsData?.map((product) => {
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

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          brand: product.brand,
          description: product.description,
          price: Number(product.price),
          promoPrice:
            product.promo_price !== null ? Number(product.promo_price) : undefined,
          stock: product.stock,
          category: product.category,
          productType: parseProductType(product.product_type),
          imageUrl: sortedImages[0]?.image_url ?? "",
        };
      }) ?? [];
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <PersonalPageHero page="favoritos" />

      <FavoritesGrid initialProducts={products} />
    </section>
  );
}
