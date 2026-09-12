import Link from "next/link";

export default function CheckoutErrorPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6 py-16">
      <div className="w-full border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-red-700">
          Pagamento não concluído
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Não foi possível concluir o pagamento
        </h1>

        <p className="mt-4 text-neutral-600">
          O pagamento foi recusado, cancelado ou ocorreu algum
          problema durante o processo. Você pode tentar novamente
          pelo carrinho.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/carrinho"
            className="bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Voltar ao carrinho
          </Link>

          <Link
            href="/perfumes"
            className="border border-neutral-300 px-6 py-3 text-sm font-medium transition hover:border-neutral-950"
          >
            Ver perfumes
          </Link>
        </div>
      </div>
    </section>
  );
}