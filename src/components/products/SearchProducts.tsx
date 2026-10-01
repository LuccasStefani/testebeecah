"use client";

import { catalogContent } from "@/src/content/catalog";
import { useMemo, useState } from "react";

import ProductCard from "@/src/components/products/ProductCard";
import { Product } from "@/src/types/product";

type SearchProductsProps = {
  products: Product[];
};

export default function SearchProducts({ products }: SearchProductsProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(catalogContent.todas);
  const [brand, setBrand] = useState<string>(catalogContent.todas);
  const [sort, setSort] = useState("relevancia");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const brands = [
    catalogContent.todas,
    ...Array.from(new Set(products.map((product) => product.brand))),
  ];

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    const minimum = minPrice === "" ? null : Number(minPrice);

    const maximum = maxPrice === "" ? null : Number(maxPrice);

    const filtered = products.filter((product) => {
      const finalPrice = product.promoPrice ?? product.price;

      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.brand.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term);

      const matchesCategory = category === "Todas" || product.category === category;

      const matchesBrand = brand === "Todas" || product.brand === brand;

      const matchesMinPrice = minimum === null || finalPrice >= minimum;

      const matchesMaxPrice = maximum === null || finalPrice <= maximum;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });

    return [...filtered].sort((a, b) => {
      const priceA = a.promoPrice ?? a.price;

      const priceB = b.promoPrice ?? b.price;

      if (sort === "menor-preco") {
        return priceA - priceB;
      }

      if (sort === "maior-preco") {
        return priceB - priceA;
      }

      if (sort === "nome") {
        return a.name.localeCompare(b.name, "pt-BR");
      }

      return 0;
    });
  }, [products, search, category, brand, sort, minPrice, maxPrice]);

  function clearFilters() {
    setSearch("");
    setCategory(catalogContent.todas);
    setBrand(catalogContent.todas);
    setSort("relevancia");
    setMinPrice("");
    setMaxPrice("");
  }

  const hasFilters =
    search !== "" ||
    category !== "Todas" ||
    brand !== "Todas" ||
    sort !== "relevancia" ||
    minPrice !== "" ||
    maxPrice !== "";

  return (
    <>
      <div className="mt-8">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={catalogContent.exYaraLattafaMasculino}
          className="w-full border border-neutral-300 px-5 py-4 outline-none transition focus:border-neutral-950"
        />
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-medium">{catalogContent.categoria}</p>

        <div className="flex flex-wrap gap-3">
          {[
            catalogContent.todas,
            catalogContent.feminino,
            catalogContent.masculino,
            catalogContent.unissex,
          ].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`border px-5 py-2.5 text-sm transition ${
                category === item
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-950"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-medium">{catalogContent.marca}</p>

        <div className="flex flex-wrap gap-3">
          {brands.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setBrand(item)}
              className={`border px-5 py-2.5 text-sm transition ${
                brand === item
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-950"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="minPrice" className="mb-2 block text-sm font-medium">
            {catalogContent.precoMinimo}
          </label>

          <input
            id="minPrice"
            type="number"
            min="0"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder={"0"}
            className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-950"
          />
        </div>

        <div>
          <label htmlFor="maxPrice" className="mb-2 block text-sm font-medium">
            {catalogContent.precoMaximo}
          </label>

          <input
            id="maxPrice"
            type="number"
            min="0"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder={"500"}
            className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-950"
          />
        </div>

        <div>
          <label htmlFor="sort" className="mb-2 block text-sm font-medium">
            {catalogContent.ordenarPor}
          </label>

          <select
            id="sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-950"
          >
            <option value="relevancia">{catalogContent.relevancia}</option>

            <option value="menor-preco">{catalogContent.menorPreco}</option>

            <option value="maior-preco">{catalogContent.maiorPreco}</option>

            <option value="nome">{catalogContent.nomeAZ}</option>
          </select>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-6">
        <p className="text-sm text-neutral-500">
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1
            ? catalogContent.produtoEncontrado
            : catalogContent.produtosEncontrados}
        </p>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium underline underline-offset-4"
          >
            {catalogContent.limparFiltros}
          </button>
        )}
      </div>

      {filteredProducts.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-16 border border-neutral-200 px-6 py-16 text-center">
          <h2 className="text-xl font-medium">
            {catalogContent.nenhumPerfumeEncontrado}
          </h2>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-6 bg-neutral-950 px-6 py-3 text-sm font-medium text-white"
          >
            {catalogContent.limparFiltros}
          </button>
        </div>
      )}
    </>
  );
}
