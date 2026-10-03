"use client";

import { preloaderStyles } from "@/src/styles/preloader";

import { useEffect, useState } from "react";
import Image from "next/image";

// Intro only: page rendering and data loading are not delayed by this animation.
export default function StorePreloader() {
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setFinished(true), 1900);
    return () => window.clearTimeout(timer);
  }, []);
  if (finished) return null;
  return (
    <div
      data-store-preloader
      className={preloaderStyles.storePreloader}
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setFinished(true);
      }}
    >
      <div className={preloaderStyles.storePreloaderLogo}>
        <div className={preloaderStyles.storePreloaderMask}>
          <Image
            src="/images/logo/LogoBlack.svg"
            alt={""}
            width={165}
            height={97}
            priority
            unoptimized
            className={preloaderStyles.storePreloaderLogoImage}
          />
        </div>
      </div>
    </div>
  );
}
