import Image from "next/image";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { bodySplashContent as content } from "@/src/content/body-splash";
import type { Product } from "@/src/types/product";
import ProductCard from "@/src/components/products/ProductCard";

const playfair = Playfair_Display({ subsets: ["latin"], weight: "400", display: "swap" });

export default function HomeBodySplash({ products }: { products: Product[] }) {
  return (
    <section
      id="body-splash"
      aria-labelledby="body-splash-heading"
      className="mx-3 my-14 scroll-mt-28 sm:mx-4 sm:my-20"
    >
      <div className="grid overflow-hidden rounded-[24px] bg-[#f3f1ed] text-[#171914] sm:rounded-[28px] md:grid-cols-[1fr_1.04fr]">
        <div className="flex flex-col items-start px-6 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <p className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-[#595951]">
            <span className="h-px w-7 bg-current" aria-hidden="true" />
            {content.eyebrow}
          </p>
          <h2
            id="body-splash-heading"
            className={
              playfair.className +
              " mt-7 text-[clamp(38px,4.8vw,64px)] leading-[1.06] tracking-[-0.04em]"
            }
          >
            {content.title}
            <br />
            <span className="font-['Bagind',serif]">{content.accent}</span>
          </h2>
          <p className="mt-5 max-w-[36ch] text-sm leading-7 text-[#65655e]">
            {content.description}
          </p>
          <Link
            href={content.href}
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-5 rounded-xl bg-[#171914] px-6 text-xs font-medium text-white transition hover:bg-[#2d416f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2d416f]"
          >
            {content.action}
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          <div className="mt-9 flex max-w-sm items-start gap-3 border-t border-black/10 pt-5 md:mt-auto md:pt-6">
            <Sparkles
              size={18}
              className="mt-1 shrink-0 text-[#2d416f]"
              aria-hidden="true"
            />
            <div>
              <p className="text-xs font-medium">{content.noteTitle}</p>
              <p className="mt-1.5 text-xs leading-5 text-[#77776f]">{content.note}</p>
            </div>
          </div>
        </div>
        <div className="relative min-h-80 overflow-hidden sm:min-h-[460px] md:min-h-[570px]">
          <Image
            src={content.image}
            alt={content.imageAlt}
            fill
            sizes="(max-width: 767px) 100vw, 640px"
            className="object-cover object-[center_42%]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
          />
          <div className="absolute inset-x-6 bottom-7 flex items-end justify-between gap-4 text-white sm:inset-x-9 sm:bottom-9">
            <p
              className={
                playfair.className + " max-w-[10ch] text-3xl leading-tight sm:text-4xl"
              }
            >
              {content.caption}
            </p>
            <p className="max-w-[12ch] text-right text-[9px] leading-5 tracking-[0.2em]">
              {content.signature}
            </p>
          </div>
        </div>
      </div>
      {products.length > 0 && (
        <div className="mt-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className={playfair.className + " text-2xl"}>{content.selection}</h3>
            <Link
              href={content.href}
              className="inline-flex min-h-11 items-center gap-2 text-xs underline underline-offset-4"
            >
              {content.all}
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
            {products.slice(0, 4).map((product) => (
              <div
                key={product.id}
                className="w-[220px] shrink-0 snap-start sm:w-[240px] lg:flex-1"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
