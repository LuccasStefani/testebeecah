// Tailwind utilities grouped by component. Keep the marker class for descendant variants.
export const preloaderStyles = {
  storePreloader: [
    "store-preloader fixed inset-0 z-[100] min-w-0 overflow-hidden grid place-items-center bg-white pointer-events-none",
    "[animation:beecah-intro-exit_280ms_1350ms_ease-in-out_forwards]",
    "[body:has(:focus-visible)_&]:hidden [@media(prefers-reduced-motion:_reduce)]:hidden",
    "[@media(prefers-reduced-motion:_reduce)]:[animation:none]",
  ].join(" "),
  storePreloaderLogo: ["store-preloader-logo w-44 max-w-[75%] sm:w-55"].join(" "),
  storePreloaderMask: ["store-preloader-mask overflow-hidden"].join(" "),
  storePreloaderLogoImage: [
    "store-preloader-logo-image block w-full h-auto",
    "[animation:beecah-logo-reveal_550ms_cubic-bezier(.22,1,.36,1)_both,_beecah-logo-hide_550ms_750ms_cubic-bezier(.65,0,.35,1)_forwards]",
    "[@media(prefers-reduced-motion:_reduce)]:[animation:none]",
  ].join(" "),
} as const satisfies Record<string, string>;
