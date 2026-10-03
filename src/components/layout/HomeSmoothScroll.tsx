"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export default function HomeSmoothScroll() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let instance: Lenis | undefined;
    let lockObserver: MutationObserver | undefined;
    const html = document.documentElement;
    const previousBehavior = html.style.scrollBehavior;

    const cleanup = () => {
      lockObserver?.disconnect();
      instance?.destroy();
      instance = undefined;
      html.style.scrollBehavior = previousBehavior;
    };
    const setup = () => {
      cleanup();
      if (preference.matches || !pointer.matches) return;
      html.style.scrollBehavior = "auto";
      instance = new Lenis({
        autoRaf: true,
        lerp: 0.075,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 0.9,
        anchors: { offset: -100 },
        allowNestedScroll: true,
        stopInertiaOnNavigate: true,
        prevent: (node) => Boolean(node.closest('[role="dialog"], [data-lenis-prevent]')),
      });
      const syncLock = () => {
        const locked =
          ["hidden", "clip"].includes(getComputedStyle(document.body).overflowY) ||
          ["hidden", "clip"].includes(html.style.overflowY || html.style.overflow);
        if (locked) instance?.stop();
        else instance?.start();
      };
      lockObserver = new MutationObserver(syncLock);
      [document.body, html].forEach((node) =>
        lockObserver?.observe(node, {
          attributes: true,
          attributeFilter: ["style", "class"],
        }),
      );
      syncLock();
    };
    setup();
    preference.addEventListener("change", setup);
    pointer.addEventListener("change", setup);
    return () => {
      cleanup();
      preference.removeEventListener("change", setup);
      pointer.removeEventListener("change", setup);
    };
  }, []);

  return null;
}
