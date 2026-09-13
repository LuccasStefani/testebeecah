import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

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

    case "refunded":
      return "Reembolsado";

    case "expired":
      return "Expirado";

    default:
      return status;
  }
}

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    redirect("/admin/login");
  }

  const { id } = await params;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select(
      `
      id,
      user_id,
      status,
      total,
      mercado_pago_preference_id,
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
    `
    )
    .eq("id", id)
    .single();

  if (orderError || !order) {
    notFound();
  }

  const {
    data: userData,
    error: userError,
  } = await supabaseAdmin.auth.admin.getUserById(order.user_id);

  if (userError) {
    console.error("Erro ao carregar cliente do pedido:", userError);
  }

  const customerEmail = userData?.user?.email ?? "E-mail não disponível";

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/admin/pedidos"
        className="text-sm text-neutral-500 transition hover:text-neutral-950"
      >
        ← Pedidos
      </Link>

      <div className="mt-6">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Pedido #{order.id.slice(0, 8)}
        </p>

        <h1 className="mt-3 text-3xl font-semibold">Detalhes do pedido</h1>

        <p className="mt-2 text-sm text-neutral-500">
          Realizado em {formatDate(order.created_at)}
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="border border-neutral-200 p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-400">
            Cliente
          </p>

          <p className="mt-2 font-medium">{customerEmail}</p>
        </div>

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

        <div className="border border-neutral-200 p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-400">
            Última atualização
          </p>

          <p className="mt-2 text-sm">{formatDate(order.updated_at)}</p>
        </div>
      </div>

      <div className="mt-8 border border-neutral-200 p-6">
        <h2 className="font-semibold">Mercado Pago</h2>

        <div className="mt-4 space-y-3 text-sm">
          <div>
            <p className="text-neutral-500">Preference ID</p>

            <p className="mt-1 break-all">
              {order.mercado_pago_preference_id ?? "Não disponível"}
            </p>
          </div>

          <div>
            <p className="text-neutral-500">Payment ID</p>

            <p className="mt-1 break-all">
              {order.mercado_pago_payment_id ?? "Não disponível"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 border border-neutral-200">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="text-lg font-semibold">Itens do pedido</h2>
        </div>

        <div className="divide-y divide-neutral-200">
          {(order.order_items ?? []).map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{item.product_name}</p>

                <p className="mt-1 text-sm text-neutral-500">
                  {item.quantity} × {formatPrice(Number(item.unit_price))}
                </p>
              </div>

              <p className="font-semibold">
                {formatPrice(Number(item.subtotal))}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
