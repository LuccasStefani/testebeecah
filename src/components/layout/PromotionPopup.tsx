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
      data-promotion-popup
      data-lenis-prevent
      aria-labelledby="promo-title"
      onCancel={(e) => {
        e.preventDefault();
        setOpen(false);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh_-_24px)] w-[calc(100%_-_24px)] min-w-0 max-w-4xl overflow-x-hidden overflow-y-auto overscroll-contain sm:max-h-[calc(100dvh_-_40px)] sm:w-[calc(100%_-_40px)] rounded-[24px] border-0 bg-white p-0 text-beecah-black shadow-2xl backdrop:bg-black/45 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div
          className="relative grid min-w-0 sm:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]"
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
            className="h-40 min-w-0 bg-neutral-100 bg-cover bg-center sm:h-auto sm:min-h-[460px]"
            style={{ backgroundImage: "url(" + JSON.stringify(slide.image) + ")" }}
          />
          <div className="flex min-w-0 flex-col items-center justify-center px-5 py-5 text-center [overflow-wrap:anywhere] sm:px-10 sm:py-9">
            <p className="font-haerins text-2xl text-beecah-blue">
              {storeContent.beecah}
            </p>
            <span className="mt-3 rounded-full bg-rose-50 sm:mt-5 px-4 py-2 text-xs font-medium text-rose-800">
              {Math.round((1 - slide.promoPrice / slide.price) * 100)}
              {storeContent.deDesconto}
            </span>
            <h2
              id="promo-title"
              className="mt-3 max-w-full text-2xl font-medium tracking-tight sm:mt-5 sm:text-4xl"
            >
              {slide.title}
            </h2>
            <p className="mt-3 max-w-full text-xs leading-5 text-neutral-500 sm:mt-4 sm:text-sm sm:leading-6">
              {slide.description}
            </p>
            <p className="mt-3 max-w-full text-sm font-medium sm:mt-5">{slide.name}</p>
            <div className="mt-3 flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span className="text-sm text-neutral-400 line-through">
                {money(slide.price)}
              </span>
              <strong className="text-2xl font-medium">{money(slide.promoPrice)}</strong>
            </div>
            <Link
              href={slide.href}
              onClick={() => setOpen(false)}
              className="mt-4 flex min-h-11 w-full sm:mt-6 sm:min-h-12 items-center justify-center gap-3 rounded-xl bg-beecah-black px-4 py-3 text-sm text-white sm:px-5 sm:py-4 hover:bg-beecah-blue"
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
