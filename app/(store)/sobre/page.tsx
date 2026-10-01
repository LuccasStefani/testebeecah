import { storeContent } from "@/src/content/store";
import Image from "next/image";
import Link from "next/link";
export const metadata = { title: storeContent.sobreABeecah };
export default function About() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 lg:grid-cols-2 lg:py-20">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-beecah-blue">
          {storeContent.byRebecaHelen}
        </p>
        <h1 className="mt-5 text-5xl leading-tight sm:text-6xl">
          {storeContent.fragranciasPara}
          <span className="font-haerins text-beecah-blue">
            {storeContent.seusMomentos}
          </span>
        </h1>
        <p className="mt-6 max-w-lg leading-8 text-neutral-600">
          {storeContent.aBeecahReunePerfumesImportadosEArabesPara}
        </p>
        <p className="mt-4 max-w-lg leading-8 text-neutral-600">
          {storeContent.dosPerfumesFemininosAosMasculinosEUnissexCada}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/perfumes"
            className="rounded-xl bg-beecah-black px-6 py-4 text-sm text-white"
          >
            {storeContent.explorarColecao2}
          </Link>
          <Link href="/atendimento" className="rounded-xl border px-6 py-4 text-sm">
            {storeContent.falarComABeecah}
          </Link>
        </div>
      </div>
      <div className="relative min-h-[420px] overflow-hidden rounded-3xl lg:min-h-[580px]">
        <Image
          src="/images/banners/bgMan.jpg"
          alt={storeContent.universoDeFragranciasBeecah}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}
