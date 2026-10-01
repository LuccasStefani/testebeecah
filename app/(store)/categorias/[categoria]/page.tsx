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
type Props = { params: Promise<{ categoria: string }> };
function resolve(key: string): CollectionKey {
  if (!Object.hasOwn(collections, key)) notFound();
  return key as CollectionKey;
}
export async function generateMetadata({ params }: Props) {
  const key = resolve((await params).categoria);
  return { title: collections[key].title, description: collections[key].description };
}
export default async function CategoryPage({ params }: Props) {
  const key = resolve((await params).categoria);
  const { products, failed } = await getCatalog();
  const ranking =
    key === "mais-vendidos" ? await getBestSellerIds() : { ids: [], failed: false };
  const selection = selectCollection(products, key, ranking.ids);
  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <nav
        aria-label={catalogContent.caminhoDeNavegacao}
        className="mb-8 flex gap-3 text-xs text-neutral-500"
      >
        <Link href="/">{catalogContent.inicio}</Link>
        <span>{"/"}</span>
        <Link href="/perfumes">{catalogContent.perfumes}</Link>
        <span>{"/"}</span>
        <span aria-current="page">{collections[key].title}</span>
      </nav>
      <header className="rounded-3xl bg-[#f2f4f8] px-6 py-10 sm:px-10">
        <p className="text-xs uppercase tracking-[.25em] text-beecah-blue">
          {catalogContent.aColecaoBeecah}
        </p>
        <h1 className="mt-4 text-4xl tracking-tight sm:text-6xl">
          {collections[key].title}
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-600">
          {collections[key].description}
        </p>
      </header>
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
          key={key}
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
