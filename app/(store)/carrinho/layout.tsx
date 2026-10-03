import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { ArrowUpRight } from "lucide-react";
import { cartContent as content } from "@/src/content/cart";

const playfair = Playfair_Display({ subsets: ["latin"], weight: "400", display: "swap" });

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-5 px-4 pt-8 pb-3 sm:px-8 sm:pt-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            {content.eyebrow}
          </p>
          <h1
            className={
              playfair.className + " mt-3 text-5xl tracking-[-0.045em] sm:text-6xl"
            }
          >
            {content.title}{" "}
            <span className="font-['Bagind',serif]">{content.accent}</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-neutral-500">
            {content.description}
          </p>
        </div>
        <Link
          href="/perfumes"
          className="inline-flex min-h-11 items-center gap-2 text-xs underline underline-offset-4"
        >
          {content.continue}
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </header>
      {children}
    </>
  );
}
