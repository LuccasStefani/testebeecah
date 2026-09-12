import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
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
  params: Promise<{
    id: string;
  }>;
};

export default async function OrderDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: order,
    error,
  } = await supabase
    .from("orders")
    .select(`
      id,
      user_id,
      status,
      total,
      mercado_pago_payment_id,
      created_at,
      updated_at,
      order_items (
        id,
        product_id,
        product_name,
        unit_price,
        quantity,
        subtotal
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !order) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/minha-conta"
        className="text-sm text-neutral-500 transition hover:text-neutral-950"
      >
        ← Minha conta
      </Link>

      <div className="mt-6">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Pedido #{order.id.slice(0, 8)}
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Detalhes do pedido
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          Realizado em {formatDate(order.created_at)}
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="border border-neutral-200 p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-400">
            Status
          </p>

          <p className="mt-2 text-lg font-semibold">
            {getStatusLabel(order.status)}
          </p>
        </div>

        <div className="border border-neutral-200 p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-400">
            Total
          </p>

          <p className="mt-2 text-lg font-semibold">
            {formatPrice(Number(order.total))}
          </p>
        </div>
      </div>

      {order.mercado_pago_payment_id && (
        <div className="mt-6 border border-neutral-200 p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-400">
            ID do pagamento
          </p>

          <p className="mt-2 text-sm">
            {order.mercado_pago_payment_id}
          </p>
        </div>
      )}

      <div className="mt-8 border border-neutral-200">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="text-lg font-semibold">
            Itens do pedido
          </h2>
        </div>

        <div className="divide-y divide-neutral-200">
          {(order.order_items ?? []).map(
            (item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {item.product_name}
                  </p>

                  <p className="mt-1 text-sm text-neutral-500">
                    {item.quantity} ×{" "}
                    {formatPrice(
                      Number(item.unit_price)
                    )}
                  </p>
                </div>

                <p className="font-semibold">
                  {formatPrice(
                    Number(item.subtotal)
                  )}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}