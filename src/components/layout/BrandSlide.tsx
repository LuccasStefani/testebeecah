import Image from "next/image";
import { showcaseContent } from "@/src/content/showcase";

const brands = [
  { name: "Versace", src: "/images/brand1.png" },
  { name: "Brand Collection", src: "/images/brand2.png" },
  { name: "Zara", src: "/images/brand3.png" },
  { name: "Prada", src: "/images/brand4.png" },
  { name: "Lattafa", src: "/images/brand5.png" },
];

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
                  className="flex h-10 w-[90px] shrink-0 items-center justify-center px-2 sm:px-4 sm:h-16 sm:w-40"
                >
                  <Image
                    src={brand.src}
                    alt={group === 0 && index < brands.length ? brand.name : ""}
                    width={300}
                    height={200}
                    className="h-full w-full object-contain grayscale"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
