import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { bentoContent, type BentoTile } from "@/src/content/bento";

function BentoImage({ tile }: { tile: BentoTile }) {
  return (
    <Image
      src={tile.image}
      alt=""
      fill
      sizes={
        tile.kind === "offer"
          ? "(min-width: 768px) 67vw, 100vw"
          : "(min-width: 768px) 45vw, 100vw"
      }
      className={`object-cover transition-transform duration-700 group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:transform-none ${tile.imagePosition ?? "object-center"}`}
    />
  );
}

export default function Bento() {
  return (
    <section className="w-full bg-beecah-white px-3 py-3 sm:px-4 lg:px-3">
      <div className="mx-auto w-full max-w-screen-2xl">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-12 md:grid-rows-[22rem_19rem] lg:grid-rows-[26rem_22rem] xl:grid-rows-[30rem_24rem]">
          {bentoContent.tiles.map((tile) => (
            <Link
              data-bento-tile
              key={tile.id}
              href={tile.href}
              className={`group relative isolate @container overflow-hidden rounded-2xl bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black ${tile.layout}`}
            >
              <BentoImage tile={tile} />
              <div
                className={`absolute inset-0 ${tile.kind === "offer" ? "bg-gradient-to-r from-white/65 via-white/15 to-transparent" : "bg-gradient-to-b from-black/50 via-black/5 to-black/30"}`}
              />
              <div
                className={`absolute inset-0 flex flex-col ${tile.kind === "offer" ? "items-start px-[6.7%] pb-[5%] pt-[8.8%] text-neutral-950" : tile.id === "populares" ? "p-[5.5%] text-white" : tile.id === "novos" ? "px-[5%] py-[5.5%] text-white" : "px-[9%] py-[9%] text-white"} ${tile.id === "feminino" ? "items-end text-right" : "items-start"}`}
              >
                {tile.eyebrow && (
                  <p className="mb-[1.5%] text-[clamp(14px,2.65cqw,24px)] font-normal leading-tight tracking-[-0.04em]">
                    {tile.eyebrow}
                  </p>
                )}
                <h2
                  className={`whitespace-pre-line font-normal leading-[1.08] tracking-[-0.045em] ${tile.kind === "offer" ? "text-[clamp(28px,6.8cqw,64px)]" : tile.id === "populares" ? "text-[clamp(18px,6.4cqw,28px)] tracking-[-0.02em]" : tile.id === "novos" ? "text-[clamp(22px,5.2cqw,34px)]" : "text-[clamp(20px,9.5cqw,34px)]"}`}
                >
                  {tile.title}
                </h2>
                {tile.description && (
                  <p className="mt-[3%] text-[clamp(11px,4.8cqw,16px)] leading-tight text-white/90">
                    {tile.description}
                  </p>
                )}
                <div className="mt-auto flex w-full flex-col items-start gap-4 pt-6">
                  {tile.note && (
                    <p className="text-left text-[clamp(10px,1.65cqw,14px)] font-normal tracking-[-0.025em]">
                      {tile.note}
                    </p>
                  )}
                  <span className="inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-xs font-medium leading-4 text-[#171914] transition-colors group-hover:bg-[#171914] group-hover:text-white group-focus-visible:bg-[#171914] group-focus-visible:text-white motion-reduce:transition-none">
                    {tile.action}
                    <ArrowUpRight size={16} strokeWidth={1.6} aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
