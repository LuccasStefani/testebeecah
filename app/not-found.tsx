import { storeContent } from "@/src/content/store";
import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-6 py-32 text-center">
      <p className="font-haerins text-5xl text-beecah-blue">{storeContent.beecah}</p>
      <p className="mt-10 text-sm text-neutral-500">
        {storeContent.paginaNaoEncontrada404}
      </p>
      <h1 className="mt-3 text-3xl">{storeContent.vamosEncontrarOutroCaminho}</h1>
      <p className="mt-4 leading-7 text-neutral-500">
        {storeContent.esteEnderecoNaoEstaDisponivelExploreNossaColecao}
      </p>
      <Link
        href="/perfumes"
        className="mt-8 inline-block rounded-xl bg-beecah-black px-6 py-3 text-white"
      >
        {storeContent.explorarPerfumes}
      </Link>
    </main>
  );
}
