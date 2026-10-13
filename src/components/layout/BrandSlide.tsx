import Image from "next/image";
import { showcaseContent } from "@/src/content/showcase";

import { brandSlideItems as brands } from "@/src/content/brands";

export default function BrandSlide() {
  return (
    <section
      aria-label={showcaseContent.brands}
      className="overflow-hidden bg-white py-3 sm:py-7"
    >
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
        <div className="flex w-max animate-[brand-marquee_32s_linear_infinite] will-change-transform motion-reduce:animate-none">
          {[0, 1].map((group) => (
            <div
              key={group}
              aria-hidden={group === 1 ? true : undefined}
              className="flex shrink-0 items-center"
            >
              {[...brands, ...brands].map((brand, index) => (
                <div
                  key={`${brand.src}-${index}`}
                  className="flex h-14 w-32 shrink-0 items-center justify-center px-3 sm:h-16 sm:w-40 sm:px-5"
                >
                  <div
                    className="relative overflow-hidden"
                    style={{
                      width: Math.min(
                        112,
                        (32 * brand.visibleWidth) / brand.visibleHeight,
                      ),
                      maxWidth: "100%",
                      aspectRatio: String(brand.visibleWidth / brand.visibleHeight),
                    }}
                  >
                    <Image
                      src={brand.src}
                      alt={group === 0 && index < brands.length ? brand.name : ""}
                      width={brand.width}
                      height={brand.height}
                      sizes="160px"
                      className="absolute max-w-none grayscale"
                      style={{
                        width: (brand.width / brand.visibleWidth) * 100 + "%",
                        height: "auto",
                        left: (-brand.x / brand.visibleWidth) * 100 + "%",
                        top: (-brand.y / brand.visibleHeight) * 100 + "%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
