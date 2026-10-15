// Adapted from the component added by Ansh — github.com/ansh-dhanani.
import type { CSSProperties } from "react";

type GradualBlurProps = {
  target?: "parent" | "page";
  position?: "bottom" | "top";
  height?: string;
  strength?: number;
  divCount?: number;
  curve?: "linear" | "bezier";
  exponential?: boolean;
  opacity?: number;
};

export default function GradualBlur({
  target = "parent",
  position = "bottom",
  height = "7rem",
  strength = 2,
  divCount = 5,
  curve = "bezier",
  exponential = true,
  opacity = 1,
}: GradualBlurProps) {
  const count = Math.max(1, Math.min(10, Math.round(divCount)));
  const direction = position === "bottom" ? "to bottom" : "to top";

  return (
    <div
      aria-hidden="true"
      className={
        "pointer-events-none inset-x-0 z-20 overflow-hidden [@media(prefers-reduced-transparency:reduce)]:hidden " +
        (target === "page" ? "fixed " : "absolute ") +
        (position === "bottom" ? "bottom-0" : "top-0")
      }
      style={{ height, opacity }}
    >
      {Array.from({ length: count }, (_, index) => {
        const progress = (index + 1) / count;
        const eased =
          curve === "bezier" ? progress * progress * (3 - 2 * progress) : progress;
        const blur = exponential
          ? Math.pow(2, eased * 4) * 0.0625 * strength
          : 0.0625 * (eased * count + 1) * strength;
        const start = (100 / count) * index;
        const end = (100 / count) * (index + 1);
        const mask = `linear-gradient(${direction}, transparent ${start}%, black ${end}%)`;
        const style: CSSProperties = {
          backdropFilter: `blur(${blur}rem)`,
          WebkitBackdropFilter: `blur(${blur}rem)`,
          maskImage: mask,
          WebkitMaskImage: mask,
        };

        return <div key={index} className="absolute inset-0" style={style} />;
      })}
    </div>
  );
}
