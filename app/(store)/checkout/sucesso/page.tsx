import { checkoutContent } from "@/src/content/checkout";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getStatusLabel(status: string) {
  switch (status) {
    case "approved":
      return checkoutContent.aprovado;
    case "pending":
      return checkoutContent.pendente;
    case "rejected":
      return checkoutContent.recusado;
    case "cancelled":
      return checkoutContent.cancelado;
    case "refunded":
      return checkoutContent.reembolsado;
    default:
      return status;
  }
}

type PageProps = {
  searchParams: Promise<{
    external_reference?: string;
  }>;
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { external_reference: orderId } = await searchParams;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let order: {
    id: string;
    status: string;
    total: number | string;
  } | null = null;

  if (orderId) {
    const { data, error } = await supabase
      .from("orders")
      .select("\n        id,\n        status,\n        total\n      ")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(checkoutContent.erroAoCarregarPedidoAposPagamento, error);
    }

    order = data;
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6 py-16">
      <div className="w-full border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-green-700">
          {checkoutContent.pagamentoAprovado}
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          {checkoutContent.pedidoRealizadoComSucesso}
        </h1>

        {order ? (
          <div className="mt-6 border border-green-200 bg-white/60 p-5">
            <p className="text-sm text-neutral-500">{checkoutContent.pedido}</p>

            <p className="mt-1 text-lg font-semibold">
              {"#"}
              {order.id.slice(0, 8)}
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-400">
                  {checkoutContent.status}
                </p>

                <p className="mt-1 font-medium">{getStatusLabel(order.status)}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-400">
                  {checkoutContent.total}
                </p>

                <p className="mt-1 font-medium">{formatPrice(Number(order.total))}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-neutral-600">
            {checkoutContent.recebemosORetornoDoSeuPagamentoVocePode}
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {order && (
            <Link
              href={`/minha-conta/pedidos/${order.id}`}
              className="bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              {checkoutContent.verPedido}
            </Link>
          )}

          <Link
            href="/minha-conta"
            className="border border-neutral-300 px-6 py-3 text-sm font-medium transition hover:border-neutral-950"
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
