"use client";

import { useRef } from "react";
import { useVisibleVideo } from "@/src/hooks/use-visible-video";

export default function BodySplashVideo({
  src,
  poster,
}: {
  src: string;
  poster: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useVisibleVideo(ref, src, 0);

  return (
    <video
      ref={ref}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full object-cover object-center"
    />
  );
}
