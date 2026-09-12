import Link from "next/link";
import { notFound } from "next/navigation";

import ProductActions from "@/src/components/products/ProductActions";
import ProductGallery from "@/src/components/products/ProductGallery";
import { supabase } from "@/src/lib/supabase/client";

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;

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
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !data) {
    notFound();
  }

  const sortedImages = [
    ...(data.product_images ?? []),
  ].sort((a, b) => a.position - b.position);

  const coverImage =
    sortedImages.find((image) => image.is_cover) ??
    sortedImages[0];

  const product = {
    id: data.id,
    name: data.name,
    slug: data.slug,
    brand: data.brand,
    description: data.description,

    price: Number(data.price),

    promoPrice:
      data.promo_price !== null
        ? Number(data.promo_price)
        : undefined,

    stock: data.stock,
    category: data.category,

    volume: data.volume ?? undefined,

    fragranceFamily:
      data.fragrance_family ?? undefined,

    topNotes: (data.top_notes ?? []) as string[],
    heartNotes: (data.heart_notes ?? []) as string[],
    baseNotes: (data.base_notes ?? []) as string[],

    featured: data.featured,
    active: data.active,

    imageUrl:
      coverImage?.image_url ??
      "/images/products/placeholder.webp",

    images: sortedImages.map(
      (image) => image.image_url
    ),
  };

  const finalPrice =
    product.promoPrice ?? product.price;

  const hasPromotion =
    product.promoPrice !== undefined &&
    product.promoPrice < product.price;

  const isOutOfStock = product.stock <= 0;

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <Link
        href="/perfumes"
        className="text-sm text-neutral-500 transition hover:text-neutral-950"
      >
        ← Voltar para perfumes
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        <ProductGallery
          name={product.name}
          images={
            product.images.length > 0
              ? product.images
              : [product.imageUrl]
          }
        />

        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            {product.brand}
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="border border-neutral-200 px-3 py-1 text-xs text-neutral-600">
              {product.category}
            </span>

            {product.volume && (
              <span className="border border-neutral-200 px-3 py-1 text-xs text-neutral-600">
                {product.volume}
              </span>
            )}

            {product.fragranceFamily && (
              <span className="border border-neutral-200 px-3 py-1 text-xs text-neutral-600">
                {product.fragranceFamily}
              </span>
            )}
          </div>

          <div className="mt-8">
            {hasPromotion && (
              <p className="text-sm text-neutral-400 line-through">
                {formatPrice(product.price)}
              </p>
            )}

            <p className="mt-1 text-3xl font-semibold">
              {formatPrice(finalPrice)}
            </p>
          </div>

          <div className="mt-5">
            {isOutOfStock ? (
              <p className="text-sm font-medium text-red-600">
                Produto esgotado
              </p>
            ) : (
              <p className="text-sm text-neutral-500">
                {product.stock} unidades em estoque
              </p>
            )}
          </div>

          <div className="mt-8 border-t border-neutral-200 pt-8">
            <h2 className="text-lg font-semibold">
              Sobre a fragrância
            </h2>

            <p className="mt-3 leading-7 text-neutral-600">
              {product.description}
            </p>
          </div>

          {(product.topNotes.length > 0 ||
            product.heartNotes.length > 0 ||
            product.baseNotes.length > 0) && (
            <div className="mt-8 border-t border-neutral-200 pt-8">
              <h2 className="text-lg font-semibold">
                Pirâmide olfativa
              </h2>

              {product.topNotes.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-medium">
                    Notas de saída
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.topNotes.map(
                      (note: string) => (
                        <span
                          key={note}
                          className="bg-neutral-100 px-3 py-2 text-sm text-neutral-600"
                        >
                          {note}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {product.heartNotes.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-medium">
                    Notas de coração
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.heartNotes.map(
                      (note: string) => (
                        <span
                          key={note}
                          className="bg-neutral-100 px-3 py-2 text-sm text-neutral-600"
                        >
                          {note}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {product.baseNotes.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-medium">
                    Notas de fundo
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.baseNotes.map(
                      (note: string) => (
                        <span
                          key={note}
                          className="bg-neutral-100 px-3 py-2 text-sm text-neutral-600"
                        >
                          {note}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <ProductActions product={product} />
        </div>
      </div>
    </section>
  );
}