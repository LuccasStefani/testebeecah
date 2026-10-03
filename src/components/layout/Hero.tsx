import Image from "next/image";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { ChevronDown, Star } from "lucide-react";
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
  compactMobile = false,
  eyebrow,
  spotlight,
}: Partial<HeroConfig> & {
  embedded?: boolean;
  compactMobile?: boolean;
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
      <div
        className={
          "relative isolate mx-auto w-full overflow-hidden rounded-[24px] sm:min-h-[300px] sm:aspect-[2.9/1] sm:rounded-[28px] md:min-h-[340px] lg:min-h-0 " +
          (compactMobile
            ? "@container aspect-[1.05/1] min-h-[360px] max-h-[480px] rounded-[20px] sm:max-h-none"
            : "min-h-[520px]")
        }
      >
        <Image
          src={imageSrc}
          alt={content.imageAlt}
          fill
          priority
          quality={75}
          sizes="(max-width: 1280px) 100vw, 1280px"
          className={
            "-z-20 object-cover sm:object-center " +
            (compactMobile ? "object-[65%_center]" : "object-[60%_center]")
          }
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

        <div
          className={
            "flex flex-col text-white sm:absolute sm:inset-0 sm:min-h-0 sm:justify-center sm:px-[3.4%] sm:py-[3%] " +
            (compactMobile
              ? "absolute inset-0 justify-end px-5 pt-6 pb-16"
              : "min-h-[520px] justify-end px-6 pt-8 pb-24")
          }
        >
          {eyebrow ? (
            <p className="mb-4 text-[10px] uppercase tracking-[0.22em] text-white/80 lg:text-xs">
              {eyebrow}
            </p>
          ) : (
            <div
              className={compactMobile ? "mb-2 sm:mb-3 lg:mb-4" : "mb-4 sm:mb-3 lg:mb-4"}
            >
              <div aria-hidden="true" className="mb-1 flex gap-0.5">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className={
                      compactMobile
                        ? "size-2.5 fill-current sm:size-2.5 lg:size-3"
                        : "size-2.5 fill-current lg:size-3"
                    }
                    strokeWidth={0}
                  />
                ))}
              </div>
              <p
                className={
                  compactMobile
                    ? "text-[10px] leading-4 text-white/85 sm:text-[10px] sm:leading-4 lg:text-xs"
                    : "text-[10px] leading-4 text-white/85 lg:text-xs"
                }
              >
                {content.trust}
              </p>
            </div>
          )}

          <h1
            id="hero-heading"
            className={`${playfair.className} max-w-[12ch] ${compactMobile ? "text-[clamp(38px,11cqw,54px)] sm:text-[clamp(42px,6vw,76px)]" : "text-[clamp(42px,6vw,76px)]"} leading-[0.98] font-normal not-italic tracking-[-0.045em]`}
          >
            {content.titleFirstLine}
            <br />
            <span className="font-['Bagind',serif] not-italic">
              {content.titleAccent}
            </span>{" "}
            {content.titleSecondLine}
          </h1>
          <p
            className={
              "leading-relaxed text-white/80 sm:mt-3 sm:max-w-[42ch] sm:text-[clamp(11px,1.2vw,15px)] lg:mt-4 " +
              (compactMobile
                ? "mt-3 max-w-[35ch] text-xs"
                : "mt-4 max-w-[35ch] text-[13px]")
            }
          >
            {content.description}
          </p>

          <div
            className={
              "flex flex-wrap items-center sm:mt-5 sm:gap-x-4 sm:gap-y-3 lg:mt-7 " +
              (compactMobile ? "mt-4 gap-x-3 gap-y-2" : "mt-6 gap-x-4 gap-y-3")
            }
          >
            <Link
              href={primaryHref}
              className={
                "inline-flex items-center justify-center bg-[#171914] font-medium uppercase tracking-[0.04em] transition hover:bg-white hover:text-black focus-visible:outline-white sm:min-h-10 sm:rounded-xl sm:px-6 sm:text-[10px] lg:min-h-12 lg:px-8 lg:text-xs " +
                (compactMobile
                  ? "min-h-10 rounded-lg px-4 text-[9px]"
                  : "min-h-11 rounded-xl px-6 text-[10px]")
              }
            >
              {content.primaryAction}
            </Link>
            <Link
              href={secondaryHref}
              className={
                "group inline-flex items-center text-white/90 transition hover:text-white focus-visible:outline-white sm:min-h-11 sm:gap-4 sm:text-[11px] lg:text-xs " +
                (compactMobile
                  ? "min-h-10 gap-2 text-[9px] [&_img]:size-3 sm:[&_img]:size-[18px]"
                  : "min-h-11 gap-4 text-[11px]")
              }
            >
              <Image src="/icons/Speakers.svg" width={18} height={18} alt="" />
              <span className="underline decoration-white/40 underline-offset-4 group-hover:decoration-white">
                {content.secondaryAction}
              </span>
            </Link>
          </div>
        </div>

        <Link
          href={collectionHref}
          className={
            "absolute right-0 bottom-0 flex max-w-[85%] items-center rounded-tl-[24px] bg-white pt-2 pr-1 pb-1 text-black focus-visible:outline-offset-[-4px] sm:gap-4 sm:pl-3 " +
            (compactMobile ? "gap-2 pl-2" : "gap-3 pl-3")
          }
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-6 right-0 size-6 rounded-br-[24px] shadow-[12px_12px_0_12px_white]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 -left-6 size-6 rounded-br-[24px] shadow-[12px_12px_0_12px_white]"
          />
          <span
            className={
              "relative flex shrink-0 items-center justify-center bg-[#171914] text-white sm:size-11 sm:rounded-xl lg:size-12 " +
              (compactMobile
                ? "size-9 rounded-lg [&_svg]:size-4 sm:[&_svg]:size-[18px]"
                : "size-11 rounded-xl")
            }
          >
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
          <span
            className={
              "relative min-w-0 truncate pr-1 font-medium uppercase tracking-wide sm:text-xs lg:text-sm " +
              (compactMobile ? "text-[11px]" : "text-xs")
            }
          >
            {spotlight ? spotlight.name : content.collectionLink}
          </span>
        </Link>
      </div>
    </section>
  );
}
