"use client";

import { storeContent } from "@/src/content/store";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CollectionLinks from "@/src/components/products/CollectionLinks";
import ProductCard from "@/src/components/products/ProductCard";
import type { Product } from "@/src/types/product";

const categories = [
  { value: "Todos", label: storeContent.todos },
  { value: "Feminino", label: storeContent.femininos },
  { value: "Masculino", label: storeContent.masculinos },
  { value: "Unissex", label: storeContent.unissex },
  { value: "Ofertas", label: storeContent.ofertas },
];

export default function HomeCollection({
  products,
  failed,
}: {
  products: Product[];
  failed: boolean;
}) {
  const [category, setCategory] = useState<string>(storeContent.todos);
  const filtered = products.filter(
    (p) =>
      category === "Todos" ||
      (category === "Ofertas"
        ? p.promoPrice !== undefined && p.promoPrice < p.price
        : p.category === category),
  );
  const destination =
    category === "Todos"
      ? "/perfumes"
      : category === "Ofertas"
        ? "/perfumes?ofertas=true"
        : "/perfumes?categoria=" + category;

  return (
    <section
      id="colecao"
      aria-labelledby="collection-heading"
      className="home-collection scroll-mt-28 px-4 pb-14 pt-12 sm:px-6 lg:pb-20 lg:pt-20"
    >
      <div className="flex items-end justify-between gap-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">
            {storeContent.selecionadosPelaBeecah}
          </p>
          <h2
            id="collection-heading"
            className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl lg:text-6xl"
          >
            {storeContent.seuProximo}
            <span className="font-haerins font-normal text-beecah-blue">
              {storeContent.favorito}
            </span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-neutral-500">
            {storeContent.escolhaPelasNotasEncontreOSeuEstiloE}
          </p>
        </div>
        <Link
          href={destination}
          className="mb-1 hidden items-center gap-5 border-b border-neutral-300 pb-2 text-xs transition hover:border-black sm:inline-flex"
        >
          {storeContent.verCatalogo}
          <ArrowRight size={17} />
        </Link>
      </div>
      <CollectionLinks />
      <div className="collection-filters mb-7 mt-7 flex items-center justify-between gap-4 border-b border-neutral-200">
        <div
          aria-label={storeContent.filtrarColecao}
          className="flex min-w-0 gap-5 overflow-x-auto sm:gap-8"
        >
          {categories.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
              className={
                "shrink-0 border-b-2 py-3 text-xs transition sm:text-sm " +
                (category === value
                  ? "border-beecah-black font-medium text-black"
                  : "border-transparent text-neutral-500 hover:text-black")
              }
            >
              {label}
            </button>
          ))}
        </div>
        <span
          role="status"
          className="hidden shrink-0 text-[11px] text-neutral-400 md:block"
        >
          {filtered.length} {filtered.length === 1 ? "perfume" : "perfumes"}
        </span>
      </div>
      {failed ? (
        <div role="alert" className="border-b border-neutral-200 py-12">
          <p>{storeContent.naoFoiPossivelCarregarAColecao}</p>
          <Link href="/perfumes" className="mt-3 inline-block text-sm underline">
            {storeContent.tentarPeloCatalogo}
          </Link>
        </div>
      ) : filtered.length ? (
        <div className="collection-products grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-6 lg:grid-cols-4">
          {filtered.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-14 text-center">
          <p className="text-sm text-neutral-500">
            {storeContent.aindaNaoHaPerfumesNestaSelecao}
          </p>
          <button
            type="button"
            onClick={() => setCategory("Todos")}
            className="mt-4 border-b border-black pb-1 text-sm"
          >
            {storeContent.verTodos}
          </button>
        </div>
      )}
      <div className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-5 text-[11px] text-neutral-500">
        <span>{storeContent.seusFavoritosFicamGuardadosNoCoracao}</span>
        <Link
          href={destination}
          className="inline-flex items-center gap-2 text-beecah-black"
        >
          {storeContent.explorarCatalogo2}
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
