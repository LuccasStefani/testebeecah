import { parseProductType } from "@/src/content/product-types";
import { cache } from "react";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { Product } from "@/src/types/product";

export const getCatalog = cache(async () => {
  const client = await createSupabaseServerClient();
  const { data, error } = await client
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      brand,
      description,
      price,
      promo_price,
      stock,
      category,
      product_type,
      is_arabian,
      is_new,
      volume,
      fragrance_family,
      top_notes,
      heart_notes,
      base_notes,
      featured,
      active,
      product_images (
        id,
        image_url,
        position,
        is_cover
      )
    `,
    )
    .eq("active", true)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Erro ao carregar catálogo:", error.message);
    return { products: [] as Product[], failed: true };
  }
  const products: Product[] = (data ?? []).map((product) => {
    const sortedImages = [...(product.product_images ?? [])].sort(
      (a, b) => a.position - b.position,
    );

    const coverImage = sortedImages.find((image) => image.is_cover) ?? sortedImages[0];

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      description: product.description ?? "",

      price: Number(product.price),

      promoPrice: product.promo_price !== null ? Number(product.promo_price) : undefined,

      stock: product.stock,
      category: product.category,
      productType: parseProductType(product.product_type),
      isArabian: product.is_arabian,
      isNew: product.is_new,

      volume: product.volume ?? undefined,

      fragranceFamily: product.fragrance_family ?? undefined,

      topNotes: product.top_notes ?? [],
      heartNotes: product.heart_notes ?? [],
      baseNotes: product.base_notes ?? [],

      featured: product.featured,
      active: product.active,

      imageUrl: coverImage?.image_url ?? "/images/products/placeholder.svg",

      images: sortedImages.map((image) => image.image_url),
    };
  });

  return { products, failed: false };
});
