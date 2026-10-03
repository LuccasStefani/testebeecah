import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import TestimonialForm from "@/src/components/testimonials/TestimonialForm";
import TestimonialMarquee from "@/src/components/testimonials/TestimonialMarquee";
import { getTestimonials } from "@/src/lib/testimonials";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { testimonialContent as content } from "@/src/content/testimonials";
import { testimonialPageContent as c } from "@/src/content/testimonial-page";

const playfair = Playfair_Display({ subsets: ["latin"], weight: "400", display: "swap" });
export const metadata = { title: content.pageTitle };

export default async function TestimonialsPage() {
  const supabase = await createSupabaseServerClient();
  const [
    reviews,
    {
      data: { user },
    },
  ] = await Promise.all([getTestimonials(), supabase.auth.getUser()]);
  return (
    <div className="mx-auto max-w-7xl px-5 pb-10 pt-5 sm:px-8">
      <nav
        aria-label={content.pageTitle}
        className="flex items-center gap-3 text-[11px] text-neutral-500"
      >
        <Link href="/" className="hover:text-black">
          {content.home}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{content.pageTitle}</span>
      </nav>
      <header className="grid items-end gap-7 pb-10 pt-10 sm:pb-12 sm:pt-14 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            {c.eyebrow}
          </p>
          <h1
            className={
              playfair.className +
              " mt-5 text-[clamp(48px,6.5vw,82px)] leading-[0.98] tracking-[-0.055em]"
            }
          >
            {c.title}
            <br />
            <span className="font-['Bagind',serif]">{c.accent}</span>
          </h1>
        </div>
        <div className="max-w-sm lg:pb-1">
          <p className="text-sm leading-7 text-neutral-600">{c.intro}</p>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <Link
              href="#enviar-depoimento"
              className="inline-flex min-h-11 items-center gap-3 rounded-xl bg-[#171914] px-5 text-xs text-white transition hover:bg-[#2d416f]"
            >
              {c.write}
              <ArrowDown size={14} />
            </Link>
            <Link
              href="/perfumes"
              className="inline-flex min-h-11 items-center gap-2 text-xs underline underline-offset-4"
            >
              {c.collection}
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </header>
      {reviews.failed && (
        <p role="status" className="mb-4 text-sm text-neutral-500">
          {c.unavailable}
        </p>
      )}
      <TestimonialMarquee items={reviews.items} />
      {reviews.items.some((item) => item.example) && (
        <p className="mt-5 text-center text-[10px] leading-5 text-neutral-500">
          {content.notice}
        </p>
      )}
      <TestimonialForm signedIn={Boolean(user)} />
    </div>
  );
}
