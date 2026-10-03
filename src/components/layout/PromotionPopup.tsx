"use client";

import {
  consentSnapshot,
  parseConsent,
  subscribeConsent,
} from "@/src/lib/cookie-consent";
import { storeContent } from "@/src/content/store";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, Pause, Play, ArrowRight } from "lucide-react";
import type { PopupSlide } from "@/src/lib/popup-types";
export default function PromotionPopup({
  slides,
  mode,
}: {
  slides: PopupSlide[];
  mode: "fixed" | "slides";
}) {
  const path = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const slide = slides[index] || slides[0];
  useEffect(() => {
    if (path !== "/" && !path.startsWith("/perfumes")) return;
    try {
      if (sessionStorage.getItem("beecah:popup-seen")) return;
    } catch {}
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (!parseConsent(consentSnapshot())) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (document.querySelector("dialog[open], [data-cookie-consent]")) return;
        setPaused(window.matchMedia(storeContent.prefersReducedMotionReduce).matches);
        setOpen(true);
        try {
          sessionStorage.setItem("beecah:popup-seen", "1");
        } catch {}
      }, 1400);
    };
    schedule();
    const unsubscribe = subscribeConsent(schedule);
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [path]);
  useEffect(() => {
    if (!open) return;
    const node = dialog.current;
    const previous = document.body.style.overflow;
    node?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node?.close();
      document.body.style.overflow = previous;
    };
  }, [open]);
  useEffect(() => {
    if (!open || paused || hover || mode !== "slides" || slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6500);
    return () => clearInterval(timer);
  }, [open, paused, hover, mode, slides.length]);
  const money = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const move = (direction: number) => {
    setPaused(true);
    setIndex((i) => (i + direction + slides.length) % slides.length);
  };
  return (
    <dialog
      ref={dialog}
      aria-labelledby="promo-title"
      onCancel={(e) => {
        e.preventDefault();
        setOpen(false);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-32px)] max-w-4xl overflow-y-auto rounded-[24px] border-0 bg-white p-0 text-beecah-black shadow-2xl backdrop:bg-black/45 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div
          className="relative grid sm:grid-cols-[.9fr_1.1fr]"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onKeyDown={() => setPaused(true)}
        >
          <button
            type="button"
            aria-label={storeContent.fecharPromocao}
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 z-10 flex size-11 items-center justify-center rounded-full bg-white/95"
          >
            <X size={23} />
          </button>
          <div
            role="img"
            aria-label={slide.name}
            className="min-h-52 bg-neutral-100 bg-cover bg-center sm:min-h-[460px]"
            style={{ backgroundImage: "url(" + JSON.stringify(slide.image) + ")" }}
          />
          <div className="flex flex-col items-center justify-center px-7 py-9 text-center sm:px-10">
            <p className="font-haerins text-2xl text-beecah-blue">
              {storeContent.beecah}
            </p>
            <span className="mt-5 rounded-full bg-rose-50 px-4 py-2 text-xs font-medium text-rose-800">
              {Math.round((1 - slide.promoPrice / slide.price) * 100)}
              {storeContent.deDesconto}
            </span>
            <h2
              id="promo-title"
              className="mt-5 text-3xl font-medium tracking-tight sm:text-4xl"
            >
              {slide.title}
            </h2>
            <p className="mt-4 text-sm leading-6 text-neutral-500">{slide.description}</p>
            <p className="mt-5 text-sm font-medium">{slide.name}</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm text-neutral-400 line-through">
                {money(slide.price)}
              </span>
              <strong className="text-2xl font-medium">{money(slide.promoPrice)}</strong>
            </div>
            <Link
              href={slide.href}
              onClick={() => setOpen(false)}
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-beecah-black px-5 py-4 text-sm text-white hover:bg-beecah-blue"
            >
              {storeContent.conhecerAOferta}
              <ArrowRight size={17} />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 min-h-11 text-xs text-neutral-500 underline underline-offset-4"
            >
              {storeContent.continuarNavegando}
            </button>
            {mode === "slides" && slides.length > 1 && (
              <div className="mt-3 flex items-center gap-4">
                <button
                  aria-label={storeContent.ofertaAnterior}
                  onClick={() => move(-1)}
                  className="p-3"
                >
                  <ChevronLeft size={17} />
                </button>
                <span className="text-xs text-neutral-500">
                  {index + 1}
                  {" / "}
                  {slides.length}
                </span>
                <button
                  aria-label={storeContent.proximaOferta}
                  onClick={() => move(1)}
                  className="p-3"
                >
                  <ChevronRight size={17} />
                </button>
                <button
                  aria-label={
                    paused
                      ? storeContent.ativarSlidesAutomaticos
                      : storeContent.pausarSlides
                  }
                  onClick={() => setPaused((p) => !p)}
                  className="p-3"
                >
                  {paused ? <Play size={15} /> : <Pause size={15} />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
