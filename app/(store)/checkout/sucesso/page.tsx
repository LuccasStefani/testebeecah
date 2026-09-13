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
      return "Aprovado";
    case "pending":
      return "Pendente";
    case "rejected":
      return "Recusado";
    case "cancelled":
      return "Cancelado";
    case "refunded":
      return "Reembolsado";
    default:
      return status;
  }
}

type PageProps = {
  searchParams: Promise<{
    external_reference?: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: PageProps) {
  const {
    external_reference: orderId,
  } = await searchParams;

  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let order:
    | {
        id: string;
        status: string;
        total: number | string;
      }
    | null = null;

  if (orderId) {
    const {
      data,
      error,
    } = await supabase
      .from("orders")
      .select(`
        id,
        status,
        total
      `)
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "Erro ao carregar pedido após pagamento:",
        error
      );
    }

    order = data;
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6 py-16">
      <div className="w-full border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-green-700">
          Pagamento aprovado
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Pedido realizado com sucesso
        </h1>

        {order ? (
          <div className="mt-6 border border-green-200 bg-white/60 p-5">
            <p className="text-sm text-neutral-500">
              Pedido
            </p>

            <p className="mt-1 text-lg font-semibold">
              #{order.id.slice(0, 8)}
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-400">
                  Status
                </p>

                <p className="mt-1 font-medium">
                  {getStatusLabel(order.status)}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-400">
                  Total
                </p>

                <p className="mt-1 font-medium">
                  {formatPrice(
                    Number(order.total)
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-neutral-600">
            Recebemos o retorno do seu pagamento.
            Você pode acompanhar o pedido pela sua conta.
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {order && (
            <Link
              href={`/minha-conta/pedidos/${order.id}`}
              className="bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Ver pedido
            </Link>
          )}

          <Link
            href="/minha-conta"
            className="border border-neutral-300 px-6 py-3 text-sm font-medium transition hover:border-neutral-950"
          >
            Minha conta
          </Link>

          <Link
            href="/perfumes"
            className="border border-neutral-300 px-6 py-3 text-sm font-medium transition hover:border-neutral-950"
          >
            Continuar comprando
          </Link>
        </div>
      </div>
    </section>
  );
}