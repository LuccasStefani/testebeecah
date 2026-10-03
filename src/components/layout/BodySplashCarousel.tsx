"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/src/components/products/ProductCard";
import type { Product } from "@/src/types/product";
import {
  bodySplashContent as content,
  bodySplashPreviewContent as preview,
  bodySplashPreviews,
} from "@/src/content/body-splash";

export default function BodySplashCarousel({ products }: { products: Product[] }) {
  const items = products.filter((product) => product.productType === "body-splash");
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const count = items.length || bodySplashPreviews.length;

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () => {
      const start = element.scrollLeft < 2;
      const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - 2;
      setEdges((previous) =>
        previous.start === start && previous.end === end ? previous : { start, end },
      );
    };
    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [count]);

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
    <div className="mt-9 min-w-0">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            {preview.eyebrow}
          </p>
          <h3 className="mt-2 font-['Sorts_Mill_Goudy',serif] text-2xl leading-tight sm:text-3xl">
            {content.selection}
          </h3>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={edges.start}
            aria-label={preview.previous}
            aria-controls="body-splash-track"
            className="flex size-11 items-center justify-center rounded-xl bg-[#171914] text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={edges.end}
            aria-label={preview.next}
            aria-controls="body-splash-track"
            className="flex size-11 items-center justify-center rounded-xl bg-[#171914] text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        ref={track}
        id="body-splash-track"
        role="region"
        aria-label={preview.region}
        tabIndex={0}
        className="flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
      >
        {items.length
          ? items.map((product) => (
              <div
                key={product.id}
                className="relative flex w-[220px] shrink-0 snap-start sm:w-[240px] lg:w-[260px]"
              >
                <ProductCard product={product} showcase />
              </div>
            ))
          : bodySplashPreviews.map((item) => (
              <article
                key={item.name}
                className="relative w-[220px] shrink-0 snap-start sm:w-[240px] lg:w-[260px]"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#f3e7e7]">
                  <Image
                    src={preview.image}
                    alt={preview.imageAlt}
                    fill
                    sizes="900px"
                    className="object-cover"
                    style={{ objectPosition: item.imagePosition }}
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] text-neutral-700">
                    {preview.label}
                  </span>
                </div>
                <p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                  {preview.eyebrow}
                </p>
                <h4 className="mt-1 text-base font-medium text-[#171914]">{item.name}</h4>
                <p className="mt-2 text-xs text-neutral-500">{preview.availability}</p>
              </article>
            ))}
      </div>
      <Link
        href={content.href}
        className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs underline underline-offset-4"
      >
        {content.all}
        <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}
