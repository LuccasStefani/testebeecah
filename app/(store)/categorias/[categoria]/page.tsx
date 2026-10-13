import Hero from "@/src/components/layout/Hero";
import { categoryHeroes } from "@/src/content/page-heroes";
import { catalogContent } from "@/src/content/catalog";
import Link from "next/link";
import { notFound } from "next/navigation";
import Catalog from "@/src/components/products/Catalog";
import CollectionLinks from "@/src/components/products/CollectionLinks";
import { getCatalog } from "@/src/lib/catalog";
import { getBestSellerIds } from "@/src/lib/best-sellers";
import {
  collections,
  selectCollection,
  type CollectionKey,
} from "@/src/lib/product-collections";
type Props = {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<{ genero?: string }>;
};
function resolve(key: string): CollectionKey {
  if (!Object.hasOwn(collections, key)) notFound();
  return key as CollectionKey;
}
export async function generateMetadata({ params }: Props) {
  const key = resolve((await params).categoria);
  return { title: collections[key].title, description: collections[key].description };
}
export default async function CategoryPage({ params, searchParams }: Props) {
  const key = resolve((await params).categoria);
  const { products, failed } = await getCatalog();
  const ranking =
    key === "mais-vendidos" ? await getBestSellerIds() : { ids: [], failed: false };
  const selection = selectCollection(products, key, ranking.ids);
  const gender = (await searchParams).genero;
  const initialCategory =
    gender && ["Masculino", "Feminino", "Unissex"].includes(gender) ? gender : "Todas";
  return (
    <section className="mx-auto w-full min-w-0 max-w-7xl px-3 py-3 sm:px-4 sm:py-8">
      <nav
        aria-label={catalogContent.caminhoDeNavegacao}
        className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-xs sm:mb-6 text-neutral-500"
      >
        <Link href="/">{catalogContent.inicio}</Link>
        <span>{"/"}</span>
        <Link href="/perfumes">{catalogContent.perfumes}</Link>
        <span>{"/"}</span>
        <span aria-current="page">{collections[key].title}</span>
      </nav>
      <Hero {...categoryHeroes[key]} embedded compactMobile />
      <div id="produtos" className="scroll-mt-32" />
      <CollectionLinks current={"/categorias/" + key} />
      {failed || ranking.failed ? (
        <div role="alert" className="rounded-2xl bg-neutral-50 p-8">
          <p>{catalogContent.naoFoiPossivelCarregarEstaSelecao}</p>
          <Link className="mt-4 inline-block underline" href={"/categorias/" + key}>
            {catalogContent.tentarNovamente}
          </Link>
        </div>
      ) : (
        <Catalog
          key={`${key}-${initialCategory}`}
          initialCategory={initialCategory}
          products={selection}
          defaultOrderLabel={
            key === "mais-vendidos"
              ? catalogContent.maisVendidos
              : catalogContent.maisRecentes
          }
          collectionMode
        />
      )}
    </section>
  );
}
