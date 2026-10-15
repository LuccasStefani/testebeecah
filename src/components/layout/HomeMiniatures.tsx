import { sectionAction } from "@/src/styles/section-actions";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import HomeShowcase from "./HomeShowcase";
import { miniatureContent as content } from "@/src/content/miniatures";
import type { Product } from "@/src/types/product";

export default function HomeMiniatures({
  products,
  failed = false,
}: {
  products: Product[];
  failed?: boolean;
}) {
  return (
    <section
      id="miniaturas"
      aria-labelledby="miniaturas-heading"
      className="mx-3 mb-14 min-w-0 scroll-mt-28 sm:mx-4 sm:mb-20"
    >
      <div className="grid overflow-hidden rounded-[24px] bg-[#f1eee8] sm:rounded-[28px] md:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col items-start justify-center px-6 py-9 sm:p-10 lg:p-12">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            {content.eyebrow}
          </p>
          <h2
            id="miniaturas-heading"
            className="mt-5 font-['Sorts_Mill_Goudy',serif] text-4xl leading-[1.08] tracking-tight text-[#171914] sm:text-5xl"
          >
            {content.title}
            <br />
            <span className="font-['Bagind',serif]">{content.accent}</span>
          </h2>
          <p className="mt-5 max-w-[40ch] text-sm leading-7 text-neutral-600">
            {content.description}
          </p>
          <Link href={content.href} className={sectionAction + " mt-6"}>
            {content.action}
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="relative min-h-64 md:min-h-[360px]">
          <Image
            src={products[0]?.imageUrl || content.image}
            alt={products[0]?.name || content.imageAlt}
            fill
            sizes="(max-width: 767px) 100vw, 600px"
            className={products[0]?.imageUrl ? "object-contain p-8" : "object-cover"}
          />
        </div>
      </div>
      <HomeShowcase
        id="miniaturas-vitrine"
        title={content.selection}
        eyebrow={content.eyebrow}
        products={products.slice(0, 12)}
        bestSellerIds={[]}
        failed={failed}
        embedded
        repeat={false}
        emptyMessage={content.empty}
      />
    </section>
  );
}
