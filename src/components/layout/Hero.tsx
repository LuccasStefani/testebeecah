"use client";

import { storeContent } from "@/src/content/store";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-beecah-white px-3 pb-3 pt-3 sm:px-4 sm:pb-4 lg:px-3 lg:pb-3">
      <div className="relative mx-auto h-[38rem] w-full max-w-screen-2xl overflow-hidden rounded-2xl sm:h-[42rem] lg:h-[calc(100vh-7rem)] lg:min-h-[38rem] lg:max-h-[52rem]">
        <Image
          src="/images/banners/bghero2.jpg"
          alt={storeContent.beecahCollection}
          fill
          priority
          quality={100}
          sizes="100vw"
          className="object-cover object-center"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />

        {/* Bloco editorial */}
        <div className="absolute left-0 top-0 z-20 w-5/6 max-w-sm rounded-br-3xl bg-beecah-white px-5 pb-5 pt-4 sm:w-96 sm:max-w-none sm:px-7 sm:pb-6 sm:pt-5 lg:w-[27rem] lg:px-8 lg:pb-7 lg:pt-6">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 top-0 size-6 rounded-tl-3xl shadow-[-0.75rem_-0.75rem_0_0.75rem_var(--beecah-white)]"
          />

          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-6 left-0 size-6 rounded-tl-3xl shadow-[-0.75rem_-0.75rem_0_0.75rem_var(--beecah-white)]"
          />

          <h1
            className={[
              "font-['Sorts_Mill_Goudy',serif] font-normal not-italic",
              "text-3xl",
              "italic",
              "leading-tight",
              "tracking-tight",
              "text-beecah-black",
              "sm:text-4xl",
              "lg:text-5xl",
            ].join(" ")}
          >
            {storeContent.encontreUma}
            <br />

            <span className="font-haerins not-italic">{storeContent.fragrancia}</span>

            <span className="ml-4 italic">{storeContent.para}</span>

            <br />

            <span className="italic">{storeContent.chamarDeSua}</span>
          </h1>

          <div className="mt-5 flex items-center gap-3">
            <span className="block h-0.5 w-9 bg-beecah-black" />

            <p className="text-xs font-medium uppercase tracking-[0.3em] text-beecah-black/65">
              {storeContent.byRebecaHelen}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 sm:bottom-7 lg:bottom-8">
          <Link
            href="/perfumes"
            className="flex h-14 min-w-56 cursor-pointer items-center justify-center rounded-2xl bg-beecah-black px-8 text-sm font-medium uppercase tracking-wide text-beecah-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-beecah-blue"
          >
            {storeContent.explorarColecao2}
          </Link>
        </div>

        {/* Perfumes */}
        <div className="absolute bottom-0 right-0 z-20 hidden items-center rounded-tl-3xl bg-beecah-white pb-1 pl-3 pr-2 pt-2 sm:flex">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-6 right-0 size-6 rounded-br-3xl shadow-[0.75rem_0.75rem_0_0.75rem_var(--beecah-white)]"
          />

          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-6 bottom-0 size-6 rounded-br-3xl shadow-[0.75rem_0.75rem_0_0.75rem_var(--beecah-white)]"
          />

          <Link
            href="/perfumes"
            aria-label={storeContent.verPerfumes}
            className="relative z-10 flex size-11 items-center justify-center rounded-xl bg-beecah-black text-beecah-white transition duration-200 hover:bg-beecah-blue"
          >
            <ChevronDown size={17} strokeWidth={1.7} />
          </Link>

          <Link
            href="/perfumes"
            className="relative z-10 cursor-pointer px-4 text-sm font-medium uppercase tracking-wide text-beecah-black"
          >
            {storeContent.perfumes}
          </Link>
        </div>
      </div>

      {/* Perfumes mobile */}
      <div className="mt-3 flex items-center justify-end gap-3 sm:hidden">
        <Link
          href="/perfumes"
          aria-label={storeContent.verPerfumes}
          className="flex size-10 items-center justify-center rounded-xl bg-beecah-black text-beecah-white transition hover:bg-beecah-blue"
        >
          <ChevronDown size={16} strokeWidth={1.7} />
        </Link>

        <Link
          href="/perfumes"
          className="cursor-pointer text-xs font-medium uppercase tracking-wide text-beecah-black"
        >
          {storeContent.perfumes}
        </Link>
      </div>
    </section>
  );
};

export default Hero;
