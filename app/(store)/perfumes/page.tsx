import { catalogContent } from "@/src/content/catalog";
import Link from "next/link";
import CollectionLinks from "@/src/components/products/CollectionLinks";
import Catalog from "@/src/components/products/Catalog";
import { getCatalog } from "@/src/lib/catalog";
export const metadata = { title: catalogContent.perfumes };
export default async function PerfumesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { products, failed } = await getCatalog();
  const category =
    typeof params.categoria === "string" &&
    ["Feminino", "Masculino", "Unissex"].includes(params.categoria)
      ? params.categoria
      : catalogContent.todas;
  const search = typeof params.q === "string" ? params.q : "";
  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <nav
        aria-label={catalogContent.caminhoDeNavegacao}
        className="mb-8 text-xs text-neutral-500"
      >
        <Link href="/" className="hover:text-black">
          {catalogContent.inicio}
        </Link>
        <span className="mx-3">{"/"}</span>
        {catalogContent.perfumes}
      </nav>
      <div className="rounded-3xl bg-[#f2f4f8] px-6 py-10 sm:px-10">
        <p className="text-xs uppercase tracking-[0.25em] text-beecah-blue">
          {catalogContent.aColecaoBeecah}
        </p>
        <h1 className="mt-3 text-4xl tracking-tight sm:text-6xl">
          {catalogContent.seuProximo}
          <span className="font-haerins text-beecah-blue">{catalogContent.perfume}</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-600">
          {catalogContent.encontreAFragranciaQueCombinaComVoceExplore}
        </p>
      </div>
      <CollectionLinks />
      {failed ? (
        <div role="alert" className="mt-8 rounded-2xl border p-8">
          <h2 className="text-xl font-medium">
            {catalogContent.naoFoiPossivelCarregarAColecao}
          </h2>
          <p className="mt-2 text-neutral-500">
            {catalogContent.tenteNovamenteEmInstantes}
          </p>
          <Link href="/perfumes" className="mt-4 inline-block underline">
            {catalogContent.tentarNovamente}
          </Link>
        </div>
      ) : (
        <Catalog
          key={JSON.stringify(params)}
          products={products}
          initialCategory={category}
          initialSearch={search}
          initialOffers={params.ofertas === "true"}
        />
      )}
    </section>
  );
}
