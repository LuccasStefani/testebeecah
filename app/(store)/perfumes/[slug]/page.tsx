import { activePromoPrice } from "@/src/lib/promotions";
import { productTypeLabel, parseProductType } from "@/src/content/product-types";
import { catalogContent } from "@/src/content/catalog";
import { productStyles } from "@/src/styles/product";

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

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const { data, error } = await supabase
    .from("products")
    .select(
      "\n      id,\n      name,\n      slug,\n      brand,\n      description,\n      price,\n      promo_price,promo_ends_on,\n      stock,\n      category,\n          product_type,\n      volume,\n      fragrance_family,\n      top_notes,\n      heart_notes,\n      base_notes,\n      featured,\n      active,\n      product_images (\n        id,\n        image_url,\n        position,\n        is_cover\n      )\n    ",
    )
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !data) {
    notFound();
  }

  const sortedImages = [...(data.product_images ?? [])].sort(
    (a, b) => a.position - b.position,
  );

  const coverImage = sortedImages.find((image) => image.is_cover) ?? sortedImages[0];

  const product = {
    id: data.id,
    name: data.name,
    slug: data.slug,
    brand: data.brand,
    description: data.description,

    price: Number(data.price),

    promoPrice: activePromoPrice(data),
    promoEndsOn: data.promo_ends_on,

    stock: data.stock,
    category: data.category,
    productType: parseProductType(data.product_type),

    volume: data.volume ?? undefined,

    fragranceFamily: data.fragrance_family ?? undefined,

    topNotes: (data.top_notes ?? []) as string[],
    heartNotes: (data.heart_notes ?? []) as string[],
    baseNotes: (data.base_notes ?? []) as string[],

    featured: data.featured,
    active: data.active,

    imageUrl: coverImage?.image_url ?? "/images/products/placeholder.webp",

    images: sortedImages.map((image) => image.image_url),
  };

  const finalPrice = product.promoPrice ?? product.price;

  const hasPromotion =
    product.promoPrice !== undefined && product.promoPrice < product.price;

  const isOutOfStock = product.stock <= 0;

  return (
    <section
      className={[
        productStyles.productDetail,
        "mx-auto",
        "max-w-7xl",
        "px-4",
        "py-6",
        "sm:px-8",
        "sm:py-10",
      ].join(" ")}
    >
      <nav
        aria-label={catalogContent.caminhoDoProduto}
        className={productStyles.productBreadcrumb}
      >
        <Link href="/">{catalogContent.inicio}</Link>
        <span aria-hidden="true">{"/"}</span>
        <Link href="/perfumes">{catalogContent.perfumes}</Link>
        <span aria-hidden="true">{"/"}</span>
        <span aria-current="page">{product.name}</span>
      </nav>
      <div className={productStyles.productLayout}>
        <div className={productStyles.productVisual}>
          <ProductGallery
            key={product.id}
            name={product.name}
            images={product.images.length ? product.images : [product.imageUrl]}
          />
          <p className={productStyles.productPhotoNote}>
            {catalogContent.exploreOsDetalhesDaSuaProximaFragrancia}
          </p>
        </div>
        <div className={productStyles.productBuyPanel}>
          <p className={productStyles.productBrand}>{product.brand}</p>
          <h1>{product.name}</h1>
          <div className={productStyles.productTags}>
            {[
              productTypeLabel(product.productType),
              product.category,
              product.volume,
              product.fragranceFamily,
            ]
              .filter(Boolean)
              .map((tag, i) => (
                <span key={i}>{tag}</span>
              ))}
          </div>
          <div className={productStyles.productPriceBox}>
            <div>
              {hasPromotion && (
                <p className={productStyles.productOldPrice}>
                  <span className="sr-only">{catalogContent.de}</span>
                  {formatPrice(product.price)}
                </p>
              )}
              <p className={productStyles.productPrice}>{formatPrice(finalPrice)}</p>
            </div>
            {hasPromotion && (
              <span className={productStyles.productDiscount}>
                {"−"}
                {Math.round((1 - finalPrice / product.price) * 100)}
                {"%"}
              </span>
            )}
          </div>
          <p
            className={
              productStyles.productAvailability + (isOutOfStock ? "unavailable" : "")
            }
          >
            {isOutOfStock
              ? catalogContent.esgotadoNoMomento
              : catalogContent.disponivel + product.stock + " unidades"}
          </p>
          <ProductActions key={product.id} product={product} />
          <div className={productStyles.productService}>
            <div>
              <span>{catalogContent.entrega}</span>
              <p>{catalogContent.consulteOFreteEAsOpcoesDeEnvio}</p>
            </div>
            <div>
              <span>{catalogContent.umaAjudaParaEscolher}</span>
              <Link href="/atendimento">{catalogContent.converseComABeecah}</Link>
            </div>
          </div>
        </div>
      </div>
      <div className={productStyles.productStory}>
        <section>
          <p className={productStyles.productBrand}>
            {catalogContent.conhecaAFragrancia}
          </p>
          <h2>
            {catalogContent.alemDo}
            <span className="font-haerins text-beecah-blue">{catalogContent.frasco}</span>
          </h2>
          <p className={productStyles.productDescription}>
            {product.description || catalogContent.querSaberMaisSobreEstePerfumeFaleCom}
          </p>
          <Link href="/perfumes" className={productStyles.productBack}>
            {catalogContent.explorarOutrosPerfumes}
          </Link>
        </section>
        <section className="product-notes">
          <p className={productStyles.productBrand}>{catalogContent.asNotasDoPerfume}</p>
          <h2>{catalogContent.piramideOlfativa}</h2>
          {[
            {
              title: catalogContent.saida,
              detail: catalogContent.aPrimeiraImpressao,
              notes: product.topNotes,
            },
            {
              title: catalogContent.coracao,
              detail: catalogContent.aPersonalidadeDaFragrancia,
              notes: product.heartNotes,
            },
            {
              title: catalogContent.fundo,
              detail: catalogContent.asNotasQuePermanecem,
              notes: product.baseNotes,
            },
          ]
            .filter((group) => group.notes.length)
            .map((group, i) => (
              <div className={productStyles.productNoteGroup} key={group.title}>
                <span className={productStyles.productNoteNumber}>
                  {"0"}
                  {i + 1}
                </span>
                <div>
                  <h3>
                    {group.title}
                    <small>{group.detail}</small>
                  </h3>
                  <div className={productStyles.productTags}>
                    {group.notes.map((note) => (
                      <span key={note}>{note}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          {!product.topNotes.length &&
            !product.heartNotes.length &&
            !product.baseNotes.length && (
              <p className={productStyles.productDescription}>
                {catalogContent.asNotasDestaFragranciaAindaNaoForamInformadas}
              </p>
            )}
        </section>
      </div>
    </section>
  );
}
