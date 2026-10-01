"use client";

import { storeContent } from "@/src/content/store";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import ProductCard from "@/src/components/products/ProductCard";
import type { Product } from "@/src/types/product";

const Bento = ({
  products,
  failed = false,
  showProducts = true,
}: {
  products: Product[];
  failed?: boolean;
  showProducts?: boolean;
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  const moveCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) return;

    const distance = carouselRef.current.clientWidth * 0.75;

    carouselRef.current.scrollBy({
      left: direction === "right" ? distance : -distance,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full bg-beecah-white px-3 py-3 sm:px-4 lg:px-3">
      <div className="mx-auto w-full max-w-screen-2xl">
        {/* BENTO */}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-12 md:grid-rows-[22rem_19rem] lg:grid-rows-[26rem_22rem] xl:grid-rows-[30rem_24rem]">
          {/* Perfumes árabes */}
          <Link
            href="/categorias/arabes"
            className="group relative min-h-96 overflow-hidden rounded-2xl bg-cover bg-center bg-no-repeat md:col-span-8 md:min-h-0"
            style={{
              backgroundImage: "url('/images/banners/bgMan.jpg')",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

            <div className="absolute bottom-7 left-7 z-10 flex items-center gap-3 text-beecah-white sm:bottom-8 sm:left-8">
              <span className="h-0.5 w-8 bg-beecah-white" />

              <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">
                {storeContent.perfumes}
              </h2>

              <span className="font-haerins text-4xl leading-none sm:text-5xl">
                {storeContent.arabes}
              </span>
            </div>
          </Link>

          {/* Decantes */}
          <Link
            href="/perfumes"
            className="group relative min-h-80 overflow-hidden rounded-2xl bg-cover bg-center bg-no-repeat md:col-span-4 md:min-h-0"
            style={{
              backgroundImage: "url('/images/banners/asadpost.jpg')",
            }}
          >
            <div className="absolute inset-0 bg-black/5 transition duration-300 group-hover:bg-black/10" />

            <div className="relative z-10 flex h-full flex-col p-7 sm:p-8 lg:p-10">
              <div className="mr-auto">
                <p className="text-2xl leading-snug text-white lg:text-3xl">
                  {storeContent.decante}
                  <br />
                  {storeContent.de}{" "}
                  <span className="font-haerins text-4xl lg:text-5xl">
                    {storeContent.arabi}
                  </span>
                </p>
              </div>

              <div className="mt-auto mr-auto">
                <Image
                  src="/icons/price.png"
                  alt={storeContent.preco}
                  width={200}
                  height={100}
                />
              </div>
            </div>
          </Link>

          {/* Masculino */}
          <Link
            href="/categorias/masculino"
            className="group relative min-h-72 overflow-hidden rounded-2xl bg-cover bg-bottom bg-no-repeat md:col-span-3 md:min-h-0"
            style={{
              backgroundImage: "url('/images/banners/bento3.png')",
            }}
          >
            <div className="absolute inset-0 bg-black/5" />

            <div className="relative z-10 flex h-full flex-col p-6 lg:p-7">
              <div>
                <h3 className="text-xl font-medium leading-tight text-beecah-black lg:text-2xl text-white">
                  {storeContent.homens}
                  <br />
                  {storeContent.colecao}
                </h3>

                <p className="mt-2 text-xs text-neutral-600 sm:text-sm text-white">
                  {storeContent.encontreSuaFragrancia}
                </p>
              </div>

              <div className="mt-auto">
                <span className="inline-flex h-11 items-center justify-center rounded-xl bg-white/50 px-5 text-xs font-medium uppercase text-beecah-black backdrop-blur-sm transition duration-300 group-hover:bg-beecah-black group-hover:text-beecah-white">
                  {storeContent.explorar}
                </span>
              </div>
            </div>
          </Link>

          {/* Feminino */}
          <Link
            href="/categorias/feminino"
            className="group relative min-h-72 overflow-hidden rounded-2xl bg-cover bg-bottom bg-no-repeat md:col-span-3 md:min-h-0"
            style={{
              backgroundImage: "url('/images/banners/womanbanner.jpg')",
            }}
          >
            <div className="absolute inset-0 bg-black/5" />

            <div className="relative z-10 flex h-full flex-col items-end p-6 text-right lg:p-7">
              <div>
                <h3 className="text-xl font-medium leading-tight text-beecah-black lg:text-2xl text-white">
                  {storeContent.mulheres}
                  <br />
                  {storeContent.colecao}
                </h3>

                <p className="mt-2 text-xs text-neutral-600 sm:text-sm text-white">
                  {storeContent.encontreSuaFragrancia}
                </p>
              </div>

              <div className="mt-auto">
                <span className="flex size-11 items-center justify-center rounded-xl bg-white/50 text-beecah-black backdrop-blur-sm transition duration-300 group-hover:bg-beecah-black group-hover:text-beecah-white">
                  <ArrowRight size={18} strokeWidth={1.6} />
                </span>
              </div>
            </div>
          </Link>

          {/* Ofertas */}
          <Link
            href="/perfumes?ofertas=true"
            className="group relative min-h-80 overflow-hidden rounded-2xl bg-cover bg-top bg-no-repeat md:col-span-6 md:min-h-0"
            style={{
              backgroundImage: "url('/images/banners/bento5.jpg')",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/20 to-transparent" />

            <div className="relative z-10 flex h-full items-center p-7 sm:p-8 lg:p-10">
              <div>
                <p className="text-xs font-medium text-white sm:text-sm">
                  {storeContent.novasOfertas}
                </p>

                <h3 className="mt-1 text-4xl font-medium leading-none tracking-tight text-white lg:text-5xl">
                  {storeContent.seu}
                  <span className="font-haerins">{storeContent.cheiro}</span>
                  <br />
                  {storeContent.emOferta}
                </h3>

                <span className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-beecah-black px-7 text-xs font-medium uppercase text-beecah-white transition duration-300 group-hover:bg-beecah-blue">
                  {storeContent.conhecerOfertas}
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* MAIS AMADOS */}
        <div
          className="relative mt-2 min-h-[26rem] overflow-hidden rounded-2xl bg-cover bg-center bg-no-repeat sm:min-h-[30rem] lg:min-h-[34rem] xl:min-h-[38rem]"
          style={{
            backgroundImage: "url('/images/banners/bannerasad.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

          {/* Bloco superior direito */}
          <div className="absolute right-0 top-0 z-20 hidden min-w-72 rounded-bl-2xl bg-beecah-white px-8 py-5 sm:block lg:min-w-96 lg:px-10 lg:py-6">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-6 top-0 size-6 rounded-tr-3xl shadow-[12px_-12px_0_12px_var(--beecah-white)]"
            />

            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-6 right-0 size-6 rounded-tr-3xl shadow-[12px_-12px_0_12px_var(--beecah-white)]"
            />

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-neutral-600">
                {storeContent.osMais}
              </span>

              <Sparkles size={17} fill="currentColor" strokeWidth={1.5} />
            </div>

            <div className="mt-2 flex items-end gap-2">
              <span className="font-haerins text-5xl leading-none text-beecah-black lg:text-6xl">
                {storeContent.amados}
              </span>

              <span className="mb-1 text-xs text-neutral-600 lg:text-sm">
                {storeContent.daColecao}
              </span>
            </div>

            <p className="mt-2 text-xs text-neutral-600 lg:text-sm">
              {storeContent.dificilEscolherSoUm}
            </p>
          </div>

          {/* Mobile */}
          <div className="absolute left-4 right-4 top-4 z-20 rounded-2xl bg-beecah-white/95 p-5 backdrop-blur-sm sm:hidden">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-neutral-600">
                {storeContent.osMais}
              </span>

              <Sparkles size={15} fill="currentColor" strokeWidth={1.5} />
            </div>

            <div className="mt-1 flex items-end gap-2">
              <span className="font-haerins text-4xl leading-none text-beecah-black">
                {storeContent.amados}
              </span>

              <span className="mb-1 text-xs text-neutral-600">
                {storeContent.daColecao}
              </span>
            </div>

            <p className="mt-1 text-xs text-neutral-600">
              {storeContent.dificilEscolherSoUm}
            </p>
          </div>

          {/* CTA */}
          <Link
            href="/perfumes"
            className="absolute bottom-5 left-1/2 z-20 flex h-12 -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-xl bg-beecah-black px-8 text-xs font-medium uppercase text-beecah-white transition duration-300 hover:-translate-y-1 hover:bg-beecah-blue sm:bottom-6 sm:h-14 sm:px-10"
          >
            {storeContent.explorarColecao2}
          </Link>

          {/* Bloco inferior esquerdo */}
          <div className="absolute bottom-0 left-0 z-20 hidden items-center gap-3 rounded-tr-2xl bg-beecah-white pb-1 pr-4 pt-2 sm:flex">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-6 left-0 size-6 rounded-bl-3xl shadow-[-12px_12px_0_12px_var(--beecah-white)]"
            />

            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 bottom-0 size-6 rounded-bl-3xl shadow-[-12px_12px_0_12px_var(--beecah-white)]"
            />

            <Link
              href="/perfumes"
              className="px-2 text-xs font-medium uppercase text-beecah-black lg:text-sm"
            >
              {storeContent.perfumes}
            </Link>

            <Link
              href="/perfumes"
              aria-label={storeContent.verPerfumes}
              className="flex size-11 items-center justify-center rounded-xl bg-beecah-black text-beecah-white transition duration-200 hover:bg-beecah-blue"
            >
              <ChevronDown size={17} strokeWidth={1.7} />
            </Link>
          </div>
        </div>

        {/* CARROSSEL ASAD COLLECTION */}
        {showProducts && (
          <div className="pb-8 pt-12 sm:pt-14 lg:pt-16">
            <div className="mb-7 flex items-end justify-between gap-5">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-widest text-neutral-600">
                  {storeContent.descubraAColecao}
                </p>

                <h2 className="text-3xl font-medium tracking-tight text-beecah-black sm:text-4xl lg:text-5xl">
                  {storeContent.nossa}{" "}
                  <span className="font-haerins font-normal">{storeContent.selecao}</span>
                </h2>
              </div>

              <div className="hidden items-center gap-2 sm:flex">
                <button
                  type="button"
                  onClick={() => moveCarousel("left")}
                  aria-label={storeContent.produtosAnteriores}
                  className="flex size-11 cursor-pointer items-center justify-center rounded-xl border border-beecah-black/10 text-beecah-black transition hover:bg-beecah-black hover:text-beecah-white"
                >
                  <ChevronLeft size={19} strokeWidth={1.6} />
                </button>

                <button
                  type="button"
                  onClick={() => moveCarousel("right")}
                  aria-label={storeContent.proximosProdutos}
                  className="flex size-11 cursor-pointer items-center justify-center rounded-xl bg-beecah-black text-beecah-white transition hover:bg-beecah-blue"
                >
                  <ChevronRight size={19} strokeWidth={1.6} />
                </button>
              </div>
            </div>

            <div
              ref={carouselRef}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="w-[85%] shrink-0 snap-start sm:w-[46%] lg:w-[31%] xl:w-[24%]"
                >
                  <ProductCard product={product} />
                </div>
              ))}
              {products.length === 0 && (
                <div className="w-full rounded-2xl bg-neutral-50 p-10 text-center">
                  <p>
                    {failed
                      ? storeContent.naoFoiPossivelCarregarASelecaoAgora
                      : storeContent.nossaProximaSelecaoEstaChegando}
                  </p>
                  <Link href="/perfumes" className="mt-4 inline-block text-sm underline">
                    {storeContent.explorarCatalogo}
                  </Link>
                </div>
              )}
            </div>

            {/* Controles mobile */}
            <div className="mt-4 flex items-center justify-between sm:hidden">
              <span className="text-xs text-neutral-600">
                {storeContent.deslizeParaExplorar}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => moveCarousel("left")}
                  aria-label={storeContent.produtosAnteriores}
                  className="flex size-10 items-center justify-center rounded-xl border border-beecah-black/10"
                >
                  <ChevronLeft size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => moveCarousel("right")}
                  aria-label={storeContent.proximosProdutos}
                  className="flex size-10 items-center justify-center rounded-xl bg-beecah-black text-beecah-white"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Bento;
