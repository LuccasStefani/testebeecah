import SearchProducts from "@/src/components/products/SearchProducts";
import { supabase } from "@/src/lib/supabase/client";
import { Product } from "@/src/types/product";

export const metadata = {
  title: "Buscar perfumes",
};

export default async function BuscarPage() {
  const { data, error } = await supabase
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
    `)
    .eq("active", true)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Erro ao buscar produtos no Supabase:",
      error
    );

    return (
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-3xl font-semibold">
          Buscar perfumes
        </h1>

        <p className="mt-6 text-red-600">
          Não foi possível carregar os produtos.
        </p>
      </section>
    );
  }

  const products: Product[] = (data ?? []).map(
    (product) => {
      const sortedImages = [
        ...(product.product_images ?? []),
      ].sort(
        (a, b) => a.position - b.position
      );

      const coverImage =
        sortedImages.find(
          (image) => image.is_cover
        ) ?? sortedImages[0];

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

        volume:
          product.volume ?? undefined,

        fragranceFamily:
          product.fragrance_family ??
          undefined,

        topNotes:
          (product.top_notes ?? []) as string[],

        heartNotes:
          (product.heart_notes ?? []) as string[],

        baseNotes:
          (product.base_notes ?? []) as string[],

        featured: product.featured,
        active: product.active,

        imageUrl:
          coverImage?.image_url ??
          "/images/products/placeholder.webp",

        images: sortedImages.map(
          (image) => image.image_url
        ),
      };
    }
  );

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold">
          Buscar perfumes
        </h1>

        <p className="mt-2 text-neutral-500">
          Encontre perfumes por nome, marca,
          categoria ou faixa de preço.
        </p>
      </div>

      <SearchProducts products={products} />
    </section>
  );
}