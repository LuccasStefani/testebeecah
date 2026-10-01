import { checkoutContent } from "@/src/content/checkout";
import Link from "next/link";

export default function CheckoutPendingPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6 py-16">
      <div className="w-full border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-amber-700">
          {checkoutContent.pagamentoPendente}
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          {checkoutContent.seuPagamentoEstaEmAnalise}
        </h1>

        <p className="mt-4 text-neutral-600">
          {checkoutContent.oMercadoPagoAindaEstaProcessandoOPagamento}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/minha-conta"
            className="bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            {checkoutContent.minhaConta}
          </Link>

          <Link
            href="/perfumes"
            className="border border-neutral-300 px-6 py-3 text-sm font-medium transition hover:border-neutral-950"
          >
            {checkoutContent.continuarComprando}
          </Link>
        </div>
      </div>
    </section>
  );
}
