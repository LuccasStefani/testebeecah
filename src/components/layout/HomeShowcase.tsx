"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/src/components/products/ProductCard";
import type { Product } from "@/src/types/product";
import { showcaseContent } from "@/src/content/showcase";

export default function HomeShowcase({
  products,
  bestSellerIds,
  failed,
  promotion = false,
  validity,
}: {
  products: Product[];
  bestSellerIds: string[];
  failed: boolean;
  promotion?: boolean;
  validity?: string;
}) {
  const sectionId = promotion ? "promocoes-da-semana" : "colecao";
  const titleId = `${sectionId}-title`;
  const trackId = `${sectionId}-track`;
  const slides = promotion
    ? products
    : products.length
      ? Array.from({ length: 6 }, (_, index) => products[index % products.length])
      : [];
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () =>
      setEdges((previous) => {
        const start = element.scrollLeft < 2;
        const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - 2;
        return previous.start === start && previous.end === end
          ? previous
          : { start, end };
      });
    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [products]);

  function move(direction: number) {
    const element = track.current;
    const card = element?.firstElementChild;
    if (!element || !card) return;
    const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
    element.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return (
    <section
      id={sectionId}
      aria-labelledby={titleId}
      className="px-4 pt-2 pb-10 sm:px-6 sm:pb-14"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">
            {promotion ? showcaseContent.promotionEyebrow : showcaseContent.eyebrow}
          </p>
          <h2
            id={titleId}
            className="mt-1 font-['Sorts_Mill_Goudy',serif] text-3xl leading-tight tracking-tight sm:text-4xl"
          >
            {promotion ? showcaseContent.promotions : showcaseContent.selection}
          </h2>
          {promotion && validity ? (
            <p className="mt-2 text-sm text-neutral-600">{validity}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={showcaseContent.previous}
            aria-controls={trackId}
            disabled={edges.start || !products.length}
            onClick={() => move(-1)}
            className="flex size-11 items-center justify-center rounded-xl bg-[#171914] text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label={showcaseContent.next}
            aria-controls={trackId}
            disabled={edges.end || !products.length}
            onClick={() => move(1)}
            className="flex size-11 items-center justify-center rounded-xl bg-[#171914] text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      {products.length ? (
        <div
          ref={track}
          id={trackId}
          role="region"
          aria-label={promotion ? showcaseContent.promotions : showcaseContent.region}
          tabIndex={0}
          className="flex items-stretch snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
        >
          {slides.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className="flex w-[220px] shrink-0 snap-start sm:w-[240px] lg:w-[260px]"
            >
              <ProductCard
                product={product}
                showcase
                bestSeller={bestSellerIds.includes(product.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="rounded-2xl bg-neutral-50 p-8 text-sm text-neutral-600"
          role={failed ? "alert" : "status"}
        >
          <p>{failed ? showcaseContent.failed : showcaseContent.empty}</p>
          <Link
            href="/perfumes"
            className="mt-3 inline-block underline underline-offset-4"
          >
            {showcaseContent.catalog}
          </Link>
        </div>
      )}
    </section>
  );
}
