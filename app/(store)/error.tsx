"use client";

import { storeContent } from "@/src/content/store";
import Link from "next/link";
export default function StoreError({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto max-w-xl px-6 py-24 text-center">
      <p className="text-xs uppercase tracking-widest text-beecah-blue">
        {storeContent.beecah}
      </p>
      <h1 className="mt-4 text-3xl">{storeContent.naoConseguimosAbrirEstaPagina}</h1>
      <p className="mt-4 text-neutral-500">
        {storeContent.tenteNovamenteSePrecisarNossoAtendimentoPodeAjudar}
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-xl bg-beecah-black px-6 py-3 text-white"
      >
        {storeContent.tentarNovamente}
      </button>
      <Link href="/atendimento" className="mt-5 block text-sm underline">
        {storeContent.falarComABeecah}
      </Link>
    </section>
  );
}
