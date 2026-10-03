import Image from "next/image";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { ChevronDown, Sparkle, Star } from "lucide-react";
import { heroContent, type HeroConfig } from "@/src/content/hero";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: "400",
  style: "normal",
  display: "swap",
});

// Soft, overlapping masks fade from 20px at the lower left to a sharp image.
const progressiveBlurLayers = [
  "backdrop-blur-[4px] [mask-image:linear-gradient(36deg,transparent_22.5%,black_27.5%,black_32.5%,transparent_40%)]",
  "backdrop-blur-[8px] [mask-image:linear-gradient(36deg,transparent_15%,black_20%,black_25%,transparent_32.5%)]",
  "backdrop-blur-[12px] [mask-image:linear-gradient(36deg,transparent_7.5%,black_12.5%,black_17.5%,transparent_25%)]",
  "backdrop-blur-[16px] [mask-image:linear-gradient(36deg,transparent_0%,black_5%,black_10%,transparent_17.5%)]",
  "backdrop-blur-[20px] [mask-image:linear-gradient(36deg,black_0%,black_2.5%,transparent_10%)]",
] as const;
export default function Hero({
  content = heroContent,
  imageSrc = "/images/banners/bghero2.jpg",
  primaryHref = "/perfumes",
  secondaryHref = "#colecao",
  collectionHref = "#colecao",
  embedded = false,
  eyebrow,
  spotlight,
}: Partial<HeroConfig> & {
  embedded?: boolean;
  eyebrow?: string;
  spotlight?: { name: string; imageUrl?: string };
}) {
  return (
    <section
      aria-labelledby="hero-heading"
      className={
        embedded ? "w-full bg-white" : "w-full bg-white px-3 py-3 sm:px-4 lg:px-3"
      }
    >
      <div className="relative isolate mx-auto min-h-[520px] w-full overflow-hidden rounded-[24px] sm:min-h-[300px] sm:aspect-[2.9/1] sm:rounded-[28px] md:min-h-[340px] lg:min-h-0">
        <Image
          src={imageSrc}
          alt={content.imageAlt}
          fill
          priority
          quality={90}
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="-z-20 object-cover object-[60%_center] sm:object-center"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          {progressiveBlurLayers.map((layer) => (
            <span key={layer} className={`absolute inset-0 ${layer}`} />
          ))}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/30 to-transparent max-sm:bg-gradient-to-t max-sm:from-black/85 max-sm:via-black/30 max-sm:to-black/5"
        />

        <div className="flex min-h-[520px] flex-col justify-end px-6 pt-8 pb-24 text-white sm:absolute sm:inset-0 sm:min-h-0 sm:justify-center sm:px-[3.4%] sm:py-[3%]">
          {eyebrow ? (
            <p className="mb-4 text-[10px] uppercase tracking-[0.22em] text-white/80 lg:text-xs">
              {eyebrow}
            </p>
          ) : (
            <div className="mb-4 sm:mb-3 lg:mb-4">
              <div aria-hidden="true" className="mb-1 flex gap-0.5">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className="size-2.5 fill-current lg:size-3"
                    strokeWidth={0}
                  />
                ))}
              </div>
              <p className="text-[10px] leading-4 text-white/85 lg:text-xs">
                {content.trust}
              </p>
            </div>
          )}

          <h1
            id="hero-heading"
            className={`${playfair.className} max-w-[12ch] text-[clamp(42px,6vw,76px)] leading-[0.98] font-normal not-italic tracking-[-0.045em]`}
          >
            {content.titleFirstLine}
            <br />
            <span className="font-['Bagind',serif] not-italic">
              {content.titleAccent}
            </span>{" "}
            {content.titleSecondLine}
          </h1>
          <p className="mt-4 max-w-[35ch] text-[13px] leading-relaxed text-white/80 sm:mt-3 sm:max-w-[42ch] sm:text-[clamp(11px,1.2vw,15px)] lg:mt-4">
            {content.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 sm:mt-5 lg:mt-7">
            <Link
              href={primaryHref}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#171914] px-6 text-[10px] font-medium uppercase tracking-[0.04em] transition hover:bg-white hover:text-black focus-visible:outline-white sm:min-h-10 lg:min-h-12 lg:px-8 lg:text-xs"
            >
              {content.primaryAction}
            </Link>
            <Link
              href={secondaryHref}
              className="group inline-flex min-h-11 items-center gap-4 text-[11px] text-white/90 transition hover:text-white focus-visible:outline-white lg:text-xs"
            >
              <Image 
              src="/icons/Speakers.svg"
              width={18}
              height={18}
              alt=""/>
              <span className="underline decoration-white/40 underline-offset-4 group-hover:decoration-white">
                {content.secondaryAction}
              </span>
            </Link>
          </div>
        </div>

        <Link
          href={collectionHref}
          className="absolute right-0 bottom-0 flex items-center gap-3 rounded-tl-[24px] bg-white pt-2 pr-1 pb-1 pl-3 text-black focus-visible:outline-offset-[-4px] sm:gap-4 sm:pl-3"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-6 right-0 size-6 rounded-br-[24px] shadow-[12px_12px_0_12px_white]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 -left-6 size-6 rounded-br-[24px] shadow-[12px_12px_0_12px_white]"
          />
          <span className="relative flex size-11 items-center justify-center rounded-xl bg-[#171914] text-white lg:size-12">
            {spotlight?.imageUrl ? (
              <Image
                src={spotlight.imageUrl}
                alt=""
                width={48}
                height={48}
                className="size-full rounded-xl object-cover"
              />
            ) : (
              <ChevronDown size={18} strokeWidth={1.6} aria-hidden="true" />
            )}
          </span>
          <span className="relative pr-1 text-xs font-medium uppercase tracking-wide lg:text-sm">
            {spotlight ? spotlight.name : content.collectionLink}
          </span>
        </Link>
      </div>
    </section>
  );
}
