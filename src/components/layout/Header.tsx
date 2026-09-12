"use client";

import Link from "next/link";
import { useCart } from "@/src/contexts/CartContext";

export default function Header() {
  const { totalItems } = useCart();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="text-2xl font-semibold tracking-wide">
          BEECAH
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/perfumes"
            className="text-sm text-neutral-700 transition hover:text-black"
          >
            Perfumes
          </Link>

          <Link
            href="/categorias/feminino"
            className="text-sm text-neutral-700 transition hover:text-black"
          >
            Feminino
          </Link>

          <Link
            href="/categorias/masculino"
            className="text-sm text-neutral-700 transition hover:text-black"
          >
            Masculino
          </Link>

          <Link
            href="/buscar"
            className="text-sm text-neutral-700 transition hover:text-black"
          >
            Buscar
          </Link>
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/favoritos"
            className="text-sm text-neutral-700 transition hover:text-black"
          >
            Favoritos
          </Link>

          <Link href="/carrinho">
            Carrinho {totalItems > 0 && `(${totalItems})`}
          </Link>
        </div>
      </div>
    </header>
  );
}
