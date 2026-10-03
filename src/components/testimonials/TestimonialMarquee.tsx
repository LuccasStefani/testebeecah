"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, List, MoveHorizontal } from "lucide-react";
import { Playfair_Display } from "next/font/google";
import type { Testimonial } from "@/src/content/testimonials";
import { testimonialPageContent as c } from "@/src/content/testimonial-page";

const playfair = Playfair_Display({ subsets: ["latin"], weight: "400", display: "swap" });

function Review({ item, full = false }: { item: Testimonial; full?: boolean }) {
  const initials = item.author
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return (
    <figure className="flex h-full flex-col rounded-2xl bg-[#f4f3ef] p-6 sm:p-7">
      <blockquote
        className={
          playfair.className +
          " break-words text-xl leading-relaxed tracking-[-0.02em] text-[#24261f] sm:text-[23px] " +
          (full ? "whitespace-pre-wrap" : "line-clamp-4")
        }
      >
        “{item.text}”
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3 pt-6">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e5e5db] text-xs font-medium text-[#444a36]"
        >
          {initials}
        </span>
        <div className="min-w-0">
          <p className="break-words text-xs font-medium">{item.author}</p>
          {item.instagram && (
            <p className="mt-0.5 break-all text-[11px] text-neutral-500">
              @{item.instagram}
            </p>
          )}
          <p className="mt-0.5 text-[10px] text-neutral-500">
            {item.example ? c.example : c.real}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}

function Row({
  items,
  reverse,
  paused,
}: {
  items: Testimonial[];
  reverse: boolean;
  paused: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const [hovered, setHovered] = useState(false);
  const stopped = paused || hovered;
  const stoppedRef = useRef(stopped);
  useEffect(() => {
    stoppedRef.current = stopped;
    if (stopped) animation.current?.pause();
    else animation.current?.play();
  }, [stopped]);
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const setup = () => {
      animation.current?.cancel();
      if (preference.matches) return;
      const distance = element.scrollWidth / 2;
      animation.current = element.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }],
        {
          duration: Math.max(35000, (distance / 25) * 1000),
          iterations: Infinity,
          easing: "linear",
          direction: reverse ? "reverse" : "normal",
        },
      );
      if (stoppedRef.current) animation.current.pause();
    };
    const observer = new ResizeObserver(setup);
    observer.observe(element);
    setup();
    preference.addEventListener("change", setup);
    return () => {
      observer.disconnect();
      animation.current?.cancel();
      preference.removeEventListener("change", setup);
    };
  }, [items, reverse]);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="overflow-hidden"
    >
      <div ref={track} className="flex w-max">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1 ? true : undefined}
            className="flex gap-4 pr-4"
          >
            {items.map((item) => (
              <div key={item.id} className="w-[280px] sm:w-[350px] lg:w-[390px]">
                <Review item={item} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TestimonialMarquee({ items }: { items: Testimonial[] }) {
  const [paused, setPaused] = useState(false);
  const [list, setList] = useState(false);
  const first = useMemo(() => items.filter((_, index) => index % 2 === 0), [items]);
  const second = useMemo(() => items.filter((_, index) => index % 2 !== 0), [items]);
  return (
    <section aria-label={c.wall}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 px-1">
        <h2 className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
          {c.wall}
        </h2>
        <div className="flex gap-4 text-[11px] text-neutral-600">
          {!list && (
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-pressed={paused}
              className="inline-flex min-h-11 items-center gap-2 hover:text-black motion-reduce:hidden"
            >
              {paused ? <Play size={13} /> : <Pause size={13} />}
              {paused ? c.play : c.pause}
            </button>
          )}
          <button
            type="button"
            onClick={() => setList((value) => !value)}
            aria-pressed={list}
            className="inline-flex min-h-11 items-center gap-2 hover:text-black motion-reduce:hidden"
          >
            {list ? <MoveHorizontal size={14} /> : <List size={14} />}
            {list ? c.animated : c.list}
          </button>
        </div>
      </div>
      {!list && (
        <div className="space-y-4 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)] motion-reduce:hidden">
          <Row items={first} reverse={false} paused={paused} />
          {second.length > 0 && <Row items={second} reverse paused={paused} />}
        </div>
      )}
      <div
        className={
          (list ? "grid" : "hidden motion-reduce:grid") +
          " gap-4 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {items.map((item) => (
          <Review key={item.id} item={item} full />
        ))}
      </div>
    </section>
  );
}
