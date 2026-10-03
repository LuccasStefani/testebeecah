"use client";
import { useEffect, type RefObject } from "react";

// Only fetch decorative video when it can actually be seen.
export function useVisibleVideo(
  ref: RefObject<HTMLVideoElement | null>,
  src: string,
  minWidth: number,
) {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const desktop = window.matchMedia("(min-width: " + minWidth + "px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let resume = true;
    const sync = () => {
      if (!visible || !desktop.matches || document.hidden || reduced.matches) {
        if (!video.paused) {
          resume = true;
          video.pause();
        }
        return;
      }
      if (!video.getAttribute("src")) {
        video.src = src;
        video.load();
      }
      if (resume) {
        resume = false;
        void video.play().catch(() => {});
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.01 },
    );
    observer.observe(video);
    desktop.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      video.pause();
      desktop.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [ref, src, minWidth]);
}
