"use client";

import { storeContent } from "@/src/content/store";
import { testimonialsStyles } from "@/src/styles/testimonials";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, MessageCircle, Star } from "lucide-react";

export type Testimonial = { id: string; text: string; author: string; rating?: number };
const invitations = [
  {
    id: "experience",
    text: storeContent.temUmPerfumeQueMarcouASuaHistoria,
    label: storeContent.conteSuaExperienciaComABeecah,
    action: storeContent.compartilharMinhaExperiencia,
    href: "/atendimento",
  },
  {
    id: "discovery",
    text: storeContent.suaProximaFragranciaPodeComecarComUmaConversa,
    label: storeContent.atendimentoBeecah,
    action: storeContent.queroAjudaParaEscolher,
    href: "/atendimento",
  },
  {
    id: "collection",
    text: storeContent.entreTantasNotasEncontreAsQueCombinamCom,
    label: storeContent.exploreAColecaoBeecah,
    action: storeContent.descobrirPerfumes,
    href: "/perfumes",
  },
];

const examples: Testimonial[] = [
  {
    id: "example-1",
    text: storeContent.encontreiUmaFragranciaParaChamarDeMinha,
    author: storeContent.clienteDeExemplo01,
    rating: 5,
  },
  {
    id: "example-2",
    text: storeContent.umPerfumeQueTransformaPequenosMomentosEmBoas,
    author: storeContent.clienteDeExemplo02,
    rating: 5,
  },
  {
    id: "example-3",
    text: storeContent.minhaProximaEscolhaJaTemLugarNosFavoritos,
    author: storeContent.clienteDeExemplo03,
    rating: 5,
  },
];

export default function HomeTestimonials({
  testimonials = examples,
}: {
  testimonials?: Testimonial[];
}) {
  const [index, setIndex] = useState(0);
  const hasReviews = testimonials.length > 0;
  const slides = hasReviews ? testimonials : invitations;
  const currentIndex = index % slides.length;
  const slide = slides[currentIndex];
  const review = hasReviews ? testimonials[currentIndex] : null;
  const invitation = !hasReviews ? invitations[currentIndex] : null;
  function move(direction: number) {
    setIndex((currentIndex + direction + slides.length) % slides.length);
  }
  return (
    <section
      className={testimonialsStyles.beecahTestimonials}
      aria-labelledby="stories-title"
      aria-roledescription={storeContent.carrossel}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        }
      }}
    >
      {testimonials === examples && (
        <p className={testimonialsStyles.storiesDemo}>
          {storeContent.previaDepoimentosIlustrativos}
        </p>
      )}
      <h2 id="stories-title" className={testimonialsStyles.storiesEyebrow}>
        {hasReviews ? storeContent.quemEscolheuABeecah : storeContent.historiasQueFicam}
      </h2>
      <div className={testimonialsStyles.storiesWatermark} aria-hidden="true">
        {hasReviews ? storeContent.suasHistorias : storeContent.suaEssencia}
      </div>
      {slides.length > 1 && (
        <>
          <p
            className={[
              testimonialsStyles.storiesGhost,
              testimonialsStyles.storiesGhostLeft,
            ].join(" ")}
            aria-hidden="true"
          >
            {slides[(currentIndex + slides.length - 1) % slides.length].text}
          </p>
          <p
            className={[
              testimonialsStyles.storiesGhost,
              testimonialsStyles.storiesGhostRight,
            ].join(" ")}
            aria-hidden="true"
          >
            {slides[(currentIndex + 1) % slides.length].text}
          </p>
        </>
      )}
      <div
        className={testimonialsStyles.storiesContent}
        aria-live="polite"
        aria-atomic="true"
      >
        {review?.rating ? (
          <div
            className={testimonialsStyles.storiesStars}
            role="img"
            aria-label={review.rating + storeContent.de5Estrelas}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={22}
                fill={i < Math.round(review.rating ?? 0) ? "currentColor" : "none"}
                aria-hidden="true"
              />
            ))}
          </div>
        ) : (
          <MessageCircle
            className={testimonialsStyles.storiesSymbol}
            size={27}
            strokeWidth={1.3}
            aria-hidden="true"
          />
        )}
        {review ? (
          <figure key={slide.id}>
            <blockquote>
              {"“"}
              {slide.text}
              {"”"}
            </blockquote>
            <figcaption>{review.author}</figcaption>
          </figure>
        ) : (
          <div key={slide.id}>
            <p className={testimonialsStyles.storiesMessage}>{slide.text}</p>
            <p className={testimonialsStyles.storiesAuthor}>{invitation?.label}</p>
          </div>
        )}
        {invitation && (
          <Link className={testimonialsStyles.storiesAction} href={invitation.href}>
            {invitation.action}
            <ArrowUpRight size={15} />
          </Link>
        )}
      </div>
      {slides.length > 1 && (
        <>
          <button
            className={[
              testimonialsStyles.storiesArrow,
              testimonialsStyles.storiesPrev,
            ].join(" ")}
            type="button"
            aria-label={storeContent.anterior}
            onClick={() => move(-1)}
          >
            <ArrowLeft size={19} />
          </button>
          <button
            className={[
              testimonialsStyles.storiesArrow,
              testimonialsStyles.storiesNext,
            ].join(" ")}
            type="button"
            aria-label={storeContent.proximo}
            onClick={() => move(1)}
          >
            <ArrowRight size={19} />
          </button>
          <div
            className={testimonialsStyles.storiesPagination}
            aria-label={storeContent.escolherSlide}
          >
            {slides.map((item, i) => (
              <button
                type="button"
                key={item.id}
                aria-label={storeContent.irParaSlide + (i + 1)}
                aria-current={i === currentIndex ? "true" : undefined}
                onClick={() => setIndex(i)}
              >
                <span />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
