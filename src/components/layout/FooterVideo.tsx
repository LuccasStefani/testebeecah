"use client";
import { useRef } from "react";
import { useVisibleVideo } from "@/src/hooks/use-visible-video";
export default function FooterVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useVisibleVideo(ref, src, 1024);
  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      className="h-full w-full object-cover object-center"
    />
  );
}
