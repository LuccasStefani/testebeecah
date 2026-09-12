import ProductCard from "@/src/components/products/ProductCard";
import { supabase } from "@/src/lib/supabase/client";

export const metadata = {
  title: "Perfumes",
};

export default async function PerfumesPage() {
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
    console.error("Erro ao buscar produtos:", error);

    return (
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-3xl font-semibold">
          Perfumes
        </h1>

        <p className="mt-6 text-red-600">
          Não foi possível carregar os produtos.
        </p>
      </section>
    );
  }

  const products = (data ?? []).map((product) => {
    const sortedImages = [
      ...(product.product_images ?? []),
    ].sort((a, b) => a.position - b.position);

    const coverImage =
      sortedImages.find((image) => image.is_cover) ??
      sortedImages[0];

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

      volume: product.volume ?? undefined,

      fragranceFamily:
        product.fragrance_family ?? undefined,

      topNotes: product.top_notes ?? [],
      heartNotes: product.heart_notes ?? [],
      baseNotes: product.base_notes ?? [],

      featured: product.featured,
      active: product.active,

      imageUrl:
        coverImage?.image_url ??
        "/images/products/placeholder.webp",

      images: sortedImages.map(
        (image) => image.image_url
      ),
    };
  });

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold">
            Perfumes
          </h1>

          <p className="mt-2 text-neutral-500">
            Encontre sua próxima fragrância.
          </p>
        </div>

        <p className="text-sm text-neutral-500">
          {products.length}{" "}
          {products.length === 1
            ? "produto"
            : "produtos"}
        </p>
      </div>

      {products.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="mt-16 border border-neutral-200 py-16 text-center">
          <p className="text-neutral-500">
            Nenhum perfume disponível.
          </p>
        </div>
      )}
    </section>
  );
}