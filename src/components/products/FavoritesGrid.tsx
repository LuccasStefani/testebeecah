"use client";

import { useState } from "react";
import Link from "next/link";

import ProductCard from "@/src/components/products/ProductCard";
import { Product } from "@/src/types/product";

type FavoritesGridProps = {
  initialProducts: Product[];
};

export default function FavoritesGrid({
  initialProducts,
}: FavoritesGridProps) {
  const [products, setProducts] =
    useState(initialProducts);

  function handleFavoriteRemoved(
    productId: string
  ) {
    setProducts((currentProducts) =>
      currentProducts.filter(
        (product) => product.id !== productId
      )
    );
  }

  if (products.length === 0) {
    return (
      <div className="mt-12 border border-neutral-200 p-8 text-center">
        <p className="text-neutral-600">
          Você ainda não adicionou nenhum perfume aos
          favoritos.
        </p>

        <Link
          href="/perfumes"
          className="mt-5 inline-block bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          Ver perfumes
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onFavoriteRemoved={
            handleFavoriteRemoved
          }
        />
      ))}
    </div>
  );
}