import Image from "next/image";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { ArrowUpRight } from "lucide-react";
import { aboutContent as content } from "@/src/content/about";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: "400",
  style: "normal",
  display: "swap",
});

export const metadata = { title: content.pageTitle };

export default function About() {
  return (
    <section
      aria-labelledby="about-title"
      className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:py-7"
    >
      <div className="grid items-center gap-7 md:grid-cols-[0.9fr_1.1fr] md:gap-10 lg:gap-16">
        <div className="relative order-2 h-56 overflow-hidden rounded-[24px] bg-neutral-100 md:order-1 md:h-[470px] lg:h-[500px]">
          <Image
            src={content.image}
            alt={content.imageAlt}
            fill
            sizes="(min-width: 1280px) 510px, (min-width: 768px) 43vw, 100vw"
            className="object-cover object-[48%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-6 text-white">
            <p className={playfair.className + " max-w-52 text-2xl leading-tight"}>
              {content.caption}
            </p>
            <span aria-hidden="true" className="text-3xl">
              ✦
            </span>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            {content.eyebrow}
          </p>
          <h1
            id="about-title"
            className={
              playfair.className +
              " mt-5 text-[42px] leading-[1.05] tracking-[-0.05em] lg:text-[58px]"
            }
          >
            {content.title}
            <span className="mt-1 block font-['Bagind',serif] text-[1.25em]">
              {content.accent}
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-6 text-neutral-800">
            {content.introduction}
          </p>
          <div className="mt-4 max-w-lg space-y-3 text-sm leading-6 text-neutral-500">
            {content.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="/perfumes"
              className="inline-flex min-h-11 items-center gap-4 rounded-xl bg-[#171914] px-5 text-xs text-white transition-colors hover:bg-[#2d416f] focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {content.primary}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/atendimento"
              className="inline-flex min-h-11 items-center text-xs underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {content.secondary}
            </Link>
          </div>
        </div>
      </div>
      <p className="mt-5 text-right text-[9px] uppercase tracking-[0.2em] text-neutral-400">
        {content.signature}
      </p>
    </section>
  );
}
