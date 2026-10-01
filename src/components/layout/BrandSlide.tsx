"use client";

import { storeContent } from "@/src/content/store";
import Image from "next/image";

const brands = [
  {
    name: storeContent.brand1,
    src: "/images/brand1.png",
    width: 300,
    height: 200,
  },
  {
    name: storeContent.brand2,
    src: "/images/brand2.png",
    width: 300,
    height: 200,
  },
  {
    name: storeContent.brand3,
    src: "/images/brand3.png",
    width: 300,
    height: 200,
  },
  {
    name: storeContent.brand4,
    src: "/images/brand4.png",
    width: 300,
    height: 200,
  },
  {
    name: storeContent.brand5,
    src: "/images/brand5.png",
    width: 300,
    height: 200,
  },
];

const BrandSlide = () => {
  return (
    <section className="w-full overflow-hidden bg-beecah-white py-7 sm:py-8 lg:py-10">
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 px-4 sm:px-6 md:flex-row md:items-center md:gap-7 lg:gap-9 lg:px-8 xl:px-10">
        <div className="relative z-20 shrink-0 bg-beecah-white md:pr-2">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-beecah-black/45">
            {storeContent.compreDe}
          </p>

          <div className="flex items-end gap-2">
            <h2 className="font-haerins text-5xl leading-none text-beecah-black/70 sm:text-6xl md:text-5xl lg:text-6xl">
              {storeContent.marcas}
            </h2>

            <span className="mb-1 text-xs font-medium uppercase tracking-widest text-beecah-black/70 sm:text-sm">
              {storeContent.como}
            </span>
          </div>
        </div>

        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-beecah-white to-transparent sm:w-8 lg:w-10" />

          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-beecah-white to-transparent sm:w-8 lg:w-10" />

          <div
            className={[
              "animate-[brand-marquee_24s_linear_infinite] will-change-transform hover:[animation-play-state:paused] motion-reduce:animate-none",
              "flex",
              "w-max",
              "items-center",
            ].join(" ")}
          >
            <div className="flex shrink-0 items-center gap-4 pr-4 sm:gap-5 sm:pr-5 md:gap-6 md:pr-6 lg:gap-7 lg:pr-7">
              {brands.map((brand) => (
                <div
                  key={`first-${brand.name}`}
                  className="flex h-20 w-32 shrink-0 items-center justify-center sm:h-24 sm:w-36 md:h-20 md:w-36 lg:h-24 lg:w-40 xl:w-44"
                >
                  <Image
                    src={brand.src}
                    alt={brand.name}
                    width={brand.width}
                    height={brand.height}
                    className="h-full w-full object-contain opacity-80 grayscale transition duration-300 hover:scale-105 hover:opacity-100"
                  />
                </div>
              ))}
            </div>

            <div
              aria-hidden="true"
              className="flex shrink-0 items-center gap-4 pr-4 sm:gap-5 sm:pr-5 md:gap-6 md:pr-6 lg:gap-7 lg:pr-7"
            >
              {brands.map((brand) => (
                <div
                  key={`second-${brand.name}`}
                  className="flex h-20 w-32 shrink-0 items-center justify-center sm:h-24 sm:w-36 md:h-20 md:w-36 lg:h-24 lg:w-40 xl:w-44"
                >
                  <Image
                    src={brand.src}
                    alt={""}
                    width={brand.width}
                    height={brand.height}
                    className="h-full w-full object-contain opacity-80 grayscale"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandSlide;
