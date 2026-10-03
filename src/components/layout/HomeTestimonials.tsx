"use client";

import { useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
import {
  testimonialContent as content,
  testimonials,
  type Testimonial,
} from "@/src/content/testimonials";
import TestimonialCard from "@/src/components/testimonials/TestimonialCard";

const playfair = Playfair_Display({ subsets: ["latin"], weight: "400", display: "swap" });
const positions = [
  "left-[4%] top-10 -rotate-6",
  "right-[4%] top-8 rotate-6",
  "left-[1%] top-[250px] rotate-3",
  "right-[1%] top-[250px] -rotate-3",
  "left-[16%] bottom-9 -rotate-3",
  "right-[16%] bottom-7 rotate-3",
];

function DraggableCard({
  item,
  index,
  bounds,
  raise,
  layer,
}: {
  item: Testimonial;
  index: number;
  bounds: RefObject<HTMLDivElement | null>;
  raise: () => void;
  layer: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const reduced = useReducedMotion();
  return (
    <motion.div
      drag
      dragConstraints={bounds}
      dragElastic={0.05}
      dragMomentum={!reduced}
      style={{ x, y, zIndex: layer }}
      whileDrag={reduced ? undefined : { scale: 1.03, rotate: 0 }}
      onPointerDown={raise}
      onFocus={raise}
      tabIndex={0}
      role="group"
      aria-label={item.author}
      aria-describedby="testimonial-keyboard"
      onKeyDown={(event) => {
        const direction = {
          ArrowLeft: [-16, 0],
          ArrowRight: [16, 0],
          ArrowUp: [0, -16],
          ArrowDown: [0, 16],
        }[event.key];
        if (event.key === "Escape") {
          x.set(0);
          y.set(0);
        }
        if (!direction || !bounds.current) return;
        event.preventDefault();
        const container = bounds.current.getBoundingClientRect();
        const card = event.currentTarget.getBoundingClientRect();
        x.set(
          x.get() +
            Math.max(
              container.left - card.left,
              Math.min(direction[0], container.right - card.right),
            ),
        );
        y.set(
          y.get() +
            Math.max(
              container.top - card.top,
              Math.min(direction[1], container.bottom - card.bottom),
            ),
        );
      }}
      className={
        "absolute w-[220px] touch-none select-none cursor-grab rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2d416f] active:cursor-grabbing xl:w-[240px] " +
        positions[index]
      }
    >
      <TestimonialCard item={item} compact />
    </motion.div>
  );
}

export default function HomeTestimonials({
  items = testimonials,
}: {
  items?: Testimonial[];
}) {
  const bounds = useRef<HTMLDivElement>(null);
  const [reset, setReset] = useState(0);
  const [layers, setLayers] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const reduced = useReducedMotion();
  return (
    <section
      aria-labelledby="testimonials-title"
      className="mx-3 my-12 overflow-hidden rounded-[28px] bg-[#f5f4f0] bg-[radial-gradient(#0000000d_1px,transparent_1px)] bg-size-[20px_20px] sm:mx-4"
    >
      <div ref={bounds} className="relative isolate px-5 py-12 lg:min-h-[720px] lg:py-0">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,#ffffff_0%,transparent_70%)]" />
        <div className="relative z-20 mx-auto max-w-[350px] text-center lg:pt-44">
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            {content.eyebrow}
          </p>
          <motion.h2
            id="testimonials-title"
            initial={false}
            whileInView={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: reduced ? 0 : 0.6 }}
            className={
              playfair.className +
              " mt-4 text-4xl leading-[1.08] tracking-tight lg:text-[44px]"
            }
          >
            {content.title}
            <br />
            <span className="font-['Bagind',serif]">{content.accent}</span>
          </motion.h2>
          <p className="mx-auto mt-4 max-w-64 text-sm leading-6 text-neutral-500">
            {content.description}
          </p>
          <Link
            href="/depoimentos"
            className="mt-6 inline-flex min-h-11 items-center gap-3 rounded-xl bg-[#171914] px-5 text-xs text-white transition hover:bg-[#2d416f] focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {content.action}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          {items.slice(0, 6).some((item) => item.example) && (
            <p className="mt-4 text-[10px] text-neutral-500">{content.demo}</p>
          )}
        </div>
        <p id="testimonial-keyboard" className="sr-only">
          {content.keyboard}
        </p>
        <div className="hidden lg:block">
          {items.slice(0, 6).map((item, index) => (
            <DraggableCard
              key={item.id + reset}
              item={item}
              index={index}
              bounds={bounds}
              layer={layers[index]}
              raise={() =>
                setLayers((current) =>
                  current.map((value, position) =>
                    position === index ? Math.max(30, ...current) + 1 : value,
                  ),
                )
              }
            />
          ))}
        </div>
        <div className="relative mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 lg:hidden">
          {items.slice(0, 6).map((item) => (
            <div key={item.id} className="w-64 shrink-0 snap-center">
              <TestimonialCard item={item} compact />
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-30 hidden items-center justify-center gap-5 pb-5 text-[10px] text-neutral-500 lg:flex">
        <span>{content.drag}</span>
        <button
          type="button"
          onClick={() => {
            setReset((value) => value + 1);
            setLayers([1, 2, 3, 4, 5, 6]);
          }}
          className="inline-flex min-h-11 items-center gap-2 hover:text-black"
        >
          <RotateCcw size={12} />
          {content.reset}
        </button>
      </div>
    </section>
  );
}
