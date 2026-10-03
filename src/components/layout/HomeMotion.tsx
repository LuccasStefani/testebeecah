"use client";

import HomeSmoothScroll from "./HomeSmoothScroll";

import { useEffect, useRef, type ReactNode } from "react";

/** Progressive enhancement: content stays visible without JavaScript or animation. */
export default function HomeMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    let observer: IntersectionObserver | undefined;
    let started = false;

    const start = () => {
      if (
        started ||
        preference.matches ||
        document.querySelector("[data-store-preloader]")
      )
        return;
      started = true;
      intro.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry, index) => {
            if (!entry.isIntersecting) return;
            observer?.unobserve(entry.target);
            const animation = entry.target.animate(
              [
                { opacity: 0, transform: "translateY(18px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              {
                duration: 600,
                delay: Math.min(index * 55, 165),
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "backwards",
              },
            );
            animations.add(animation);
            animation.onfinish = () => animations.delete(animation);
          });
        },
        { threshold: 0.08 },
      );
      element
        .querySelectorAll(
          "#hero-heading, #hero-heading + p, #hero-heading + p + div, #showcase-title, #showcase-track > div, [data-bento-tile], .home-intro, #body-splash-heading",
        )
        .forEach((target) => observer?.observe(target));
    };

    const intro = new MutationObserver(start);
    intro.observe(document.body, { childList: true, subtree: true });
    start();
    const onPreferenceChange = () => {
      if (preference.matches) {
        observer?.disconnect();
        animations.forEach((animation) => animation.cancel());
        animations.clear();
      } else {
        started = false;
        start();
      }
    };
    preference.addEventListener("change", onPreferenceChange);
    return () => {
      intro.disconnect();
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      preference.removeEventListener("change", onPreferenceChange);
    };
  }, []);

  return (
    <div ref={root}>
      <HomeSmoothScroll />
      {children}
    </div>
  );
}
