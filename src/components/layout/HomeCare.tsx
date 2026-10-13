import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import HomeShowcase from "@/src/components/layout/HomeShowcase";
import { homeCareContent as content } from "@/src/content/home-care";
import type { Product } from "@/src/types/product";

export default function HomeCare({ products }: { products: Product[] }) {
  return (
    <div className="space-y-14 px-3 pb-14 sm:space-y-20 sm:px-4 sm:pb-20">
      {content.sections.map((section, index) => {
        const selection = products
          .filter(
            (product) =>
              product.category === section.gender &&
              section.types.some((type) => type === product.productType),
          )
          .slice(0, 12);
        const dark = index === 0;
        return (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={section.id + "-title"}
            className="min-w-0 scroll-mt-28"
          >
            <div
              className={
                "group grid overflow-hidden rounded-[24px] sm:rounded-[28px] md:grid-cols-[1fr_1.1fr] " +
                (dark ? "bg-[#171914] text-white" : "bg-[#f3f1ed] text-[#171914]")
              }
            >
              <div
                className={
                  "relative min-h-56 sm:min-h-64 md:min-h-[340px] " +
                  (dark ? "md:order-2" : "")
                }
              >
                <Image
                  src={section.image}
                  alt={section.imageAlt}
                  fill
                  sizes="(max-width: 767px) 100vw, 620px"
                  className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.03]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
                />
                <span className="absolute bottom-6 left-6 text-[10px] tracking-[0.2em] text-white/90">
                  {content.signature}
                </span>
              </div>
              <div className="flex flex-col items-start justify-center px-6 py-8 sm:p-9 lg:p-10">
                <p
                  className={
                    "text-[10px] uppercase tracking-[0.16em] " +
                    (dark ? "text-white/60" : "text-neutral-500")
                  }
                >
                  {section.eyebrow}
                </p>
                <h2
                  id={section.id + "-title"}
                  className="mt-5 font-['Sorts_Mill_Goudy',serif] text-4xl leading-[1.05] tracking-tight sm:text-5xl"
                >
                  {section.title}
                  <br />
                  <span className="font-['Bagind',serif]">{section.accent}</span>
                </h2>
                <p
                  className={
                    "mt-4 max-w-[40ch] text-sm leading-6 " +
                    (dark ? "text-white/70" : "text-neutral-600")
                  }
                >
                  {section.description}
                </p>
                <div className="mt-6 flex w-full flex-wrap items-center gap-3">
                  {section.links.map((link, linkIndex) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={
                        "inline-flex min-h-11 items-center justify-center gap-3 rounded-xl px-4 py-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 " +
                        (linkIndex === 0
                          ? dark
                            ? "bg-white text-[#171914] hover:bg-neutral-200"
                            : "bg-[#171914] text-white hover:bg-neutral-700"
                          : dark
                            ? "text-white underline decoration-white/30 underline-offset-4 hover:bg-white/10"
                            : "text-[#171914] underline decoration-black/30 underline-offset-4 hover:bg-black/5")
                      }
                    >
                      {link.label}
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            {selection.length > 0 ? (
              <HomeShowcase
                id={section.id + "-produtos"}
                products={selection}
                bestSellerIds={[]}
                failed={false}
                title={section.gender === "Masculino" ? content.forHim : content.forHer}
                eyebrow={content.selection}
                repeat={false}
                embedded
              />
            ) : (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-neutral-500">
                <p className="max-w-xl">{content.empty}</p>
                <Link
                  href={content.catalog}
                  className="inline-flex min-h-11 items-center gap-2 text-xs text-[#171914] underline underline-offset-4"
                >
                  {content.explore}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
