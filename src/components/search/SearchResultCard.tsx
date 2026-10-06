import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { productTypeLabel } from "@/src/content/product-types";
import { searchResultContent as content } from "@/src/content/search-results";
import type { Product } from "@/src/types/product";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const categoryColors: Record<string, string> = {
  feminino: "bg-[#DCA7E5]",
  masculino: "bg-[#E6DBA8]",
  unissex: "bg-[#B1E5A5]",
};

export default function SearchResultCard({
  product,
  onSelect,
}: {
  product: Product;
  onSelect: () => void;
}) {
  const hasPromotion =
    product.promoPrice !== undefined && product.promoPrice < product.price;
  const price = hasPromotion ? product.promoPrice! : product.price;
  const discount =
    hasPromotion && product.price > 0 ? Math.round((1 - price / product.price) * 100) : 0;
  const details = [product.volume, product.fragranceFamily].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/perfumes/${product.slug}`}
      onClick={onSelect}
      aria-label={`${content.view}: ${product.name}`}
      className="group relative grid min-w-0 grid-cols-[88px_minmax(0,1fr)] gap-3 rounded-2xl bg-white p-2.5 text-[#171914] transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171914] sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-4 sm:p-3"
    >
      <div className="relative min-h-[134px] self-stretch overflow-hidden rounded-xl bg-neutral-100 sm:min-h-[148px]">
        <Image
          src={product.imageUrl}
          alt=""
          fill
          sizes="(max-width: 639px) 88px, 120px"
          className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 rounded-full bg-[#171914] px-2 py-1 text-[10px] font-medium text-white">
            −{discount}%
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-col py-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <p className="min-w-0 flex-1 truncate text-[10px] uppercase tracking-[0.1em] text-neutral-500">
            {product.brand}
          </p>
          {product.category && (
            <span
              className={`rounded-lg px-2.5 py-1 text-[10px] font-medium ${categoryColors[product.category.toLowerCase()] ?? "bg-neutral-100"}`}
            >
              {product.category}
            </span>
          )}
        </div>
        <h3 className="mt-2 line-clamp-2 break-words text-sm font-medium leading-snug sm:text-lg">
          {product.name}
        </h3>
        <p className="mt-1 text-[10px] text-neutral-500 sm:text-xs">
          {productTypeLabel(product.productType)}
          {details ? ` · ${details}` : ""}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            {hasPromotion && (
              <p className="text-[10px] text-neutral-400 sm:text-xs">
                <span className="sr-only">{content.previousPrice} </span>
                <del>{currency.format(product.price)}</del>
              </p>
            )}
            <p
              className={`text-base font-semibold leading-tight tracking-tight sm:text-xl ${hasPromotion ? "text-rose-700" : "text-beecah-black"}`}
            >
              {hasPromotion && <span className="sr-only">{content.currentPrice} </span>}
              {currency.format(price)}
            </p>
            {product.stock <= 0 && (
              <p className="mt-1 text-[10px] text-neutral-500">{content.unavailable}</p>
            )}
          </div>
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#171914] text-white transition-colors group-hover:bg-[#2d416f] sm:size-10 sm:rounded-xl"
          >
            <ArrowUpRight size={17} strokeWidth={1.6} />
          </span>
        </div>
      </div>
    </Link>
  );
}
