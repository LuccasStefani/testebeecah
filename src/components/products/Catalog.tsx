"use client";
import {
  productTypeContent,
  productTypeSearchText,
  parseProductType,
} from "@/src/content/product-types";

import { catalogContent } from "@/src/content/catalog";
import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "@/src/types/product";

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const price = (p: Product) =>
  p.promoPrice !== undefined && p.promoPrice < p.price ? p.promoPrice : p.price;

export default function Catalog({
  products,
  initialCategory = catalogContent.todas,
  initialSearch = "",
  initialOffers = false,
  defaultOrderLabel = catalogContent.maisRecentes,
  collectionMode = false,
}: {
  products: Product[];
  initialCategory?: string;
  initialSearch?: string;
  initialOffers?: boolean;
  defaultOrderLabel?: string;
  collectionMode?: boolean;
}) {
  const [productType, setProductType] = useState("");
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState("recentes");
  const [arabian, setArabian] = useState(false);
  const [offers, setOffers] = useState(initialOffers);
  const [available, setAvailable] = useState(false);
  const [maximum, setMaximum] = useState("");
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  const filtered = products
    .filter(
      (p) =>
        (!search.trim() ||
          normalize(
            [
              p.name,
              p.brand,
              p.description,
              p.fragranceFamily,
              productTypeSearchText(p.productType),
            ].join(" "),
          ).includes(normalize(search.trim()))) &&
        (category === "Todas" || p.category === category) &&
        (!productType || parseProductType(p.productType) === productType) &&
        (!brand || p.brand === brand) &&
        (!arabian || p.isArabian) &&
        (!offers || price(p) < p.price) &&
        (!available || p.stock > 0) &&
        (!maximum || price(p) <= Number(maximum)),
    )
    .sort((a, b) =>
      sort === "menor"
        ? price(a) - price(b)
        : sort === "maior"
          ? price(b) - price(a)
          : sort === "nome"
            ? a.name.localeCompare(b.name, "pt-BR")
            : 0,
    );
  function reset() {
    setProductType("");
    setArabian(false);
    setSearch("");
    setCategory(catalogContent.todas);
    setBrand("");
    setSort("recentes");
    setOffers(false);
    setAvailable(false);
    setMaximum("");
  }
  const hasFilters = Boolean(
    productType ||
      arabian ||
      search ||
      category !== "Todas" ||
      brand ||
      offers ||
      available ||
      maximum,
  );
  const inputClass =
    "mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm";
  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2" aria-label={catalogContent.categorias}>
        {[
          catalogContent.todas,
          catalogContent.feminino,
          catalogContent.masculino,
          catalogContent.unissex,
        ].map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
            className={
              "rounded-full border px-5 py-2.5 text-sm transition " +
              (category === item
                ? "border-beecah-black bg-beecah-black text-white"
                : "border-neutral-200 hover:border-beecah-black")
            }
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5 lg:sticky lg:top-28">
          <h2 className="flex items-center gap-2 font-medium">
            <SlidersHorizontal size={17} />
            {catalogContent.encontreSeuPerfume}
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <label className="block text-sm">
              {productTypeContent.label}
              <select
                value={productType}
                onChange={(event) => setProductType(event.target.value)}
                className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
              >
                <option value="">{productTypeContent.all}</option>
                {Object.entries(productTypeContent.labels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              {catalogContent.nomeOuFragrancia}
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={catalogContent.exYaraAmadeirado}
                className={inputClass}
              />
            </label>
            <label className="text-sm">
              {catalogContent.marca}
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className={inputClass}
              >
                <option value="">{catalogContent.todasAsMarcas}</option>
                {brands.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              {catalogContent.precoMaximoR}
              <input
                type="number"
                min="0"
                step="0.01"
                value={maximum}
                onChange={(e) => setMaximum(e.target.value)}
                placeholder={catalogContent.semLimite}
                className={inputClass}
              />
            </label>
            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={arabian}
                  onChange={(e) => setArabian(e.target.checked)}
                  className="size-4 accent-beecah-blue"
                />
                {catalogContent.apenasPerfumesArabes}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={offers}
                  onChange={(e) => setOffers(e.target.checked)}
                  className="size-4 accent-beecah-blue"
                />
                {catalogContent.apenasOfertas}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="size-4 accent-beecah-blue"
                />
                {catalogContent.disponiveisEmEstoque}
              </label>
            </div>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={reset}
              className="mt-5 text-sm underline underline-offset-4"
            >
              {catalogContent.limparFiltros}
            </button>
          )}
        </aside>
        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <p role="status" className="text-sm text-neutral-500">
              {filtered.length}{" "}
              {filtered.length === 1
                ? catalogContent.perfumeEncontrado
                : catalogContent.perfumesEncontrados}
            </p>
            <label className="flex items-center gap-2 text-sm">
              {catalogContent.ordenarPor}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2"
              >
                <option value="recentes">{defaultOrderLabel}</option>
                <option value="menor">{catalogContent.menorPreco}</option>
                <option value="maior">{catalogContent.maiorPreco}</option>
                <option value="nome">{catalogContent.nomeAZ}</option>
              </select>
            </label>
          </div>
          {filtered.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-300 px-6 py-20 text-center">
              <Search size={30} className="mx-auto text-neutral-400" />
              <h2 className="mt-4 text-xl font-medium">
                {catalogContent.nenhumPerfumePorAqui}
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                {collectionMode && products.length === 0
                  ? catalogContent.estaSelecaoAindaNaoTemPerfumesDisponiveisExplore
                  : catalogContent.experimenteOutraBuscaOuRemovaOsFiltros}
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-6 rounded-xl bg-beecah-black px-6 py-3 text-sm text-white"
              >
                {catalogContent.limparFiltros}
              </button>
              {collectionMode && (
                <Link href="/perfumes" className="mt-4 block text-sm underline">
                  {catalogContent.verTodosOsPerfumes}
                </Link>
              )}
            </div>
          )}
          <Link
            href="/atendimento"
            className="mt-8 flex items-center justify-between gap-4 rounded-2xl bg-[#f2f4f8] p-5 text-sm text-beecah-blue"
          >
            {catalogContent.precisaDeAjudaParaEscolherFaleComA}
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
