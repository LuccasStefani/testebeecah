import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
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

    case "expired":
      return "Expirado";

    default:
      return status;
  }
}

export default async function MinhaContaPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      `
      id,
      status,
      total,
      created_at
    `
    )
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (ordersError) {
    console.error("Erro ao carregar pedidos:", ordersError);
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Minha conta
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Olá, seja bem-vindo
        </h1>

        <p className="mt-2 text-neutral-500">{user.email}</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/favoritos"
          className="border border-neutral-200 p-6 transition hover:border-neutral-950"
        >
          <h2 className="font-semibold">Favoritos</h2>

          <p className="mt-2 text-sm text-neutral-500">
            Veja os perfumes que você salvou.
          </p>
        </Link>

        <Link
          href="/carrinho"
          className="border border-neutral-200 p-6 transition hover:border-neutral-950"
        >
          <h2 className="font-semibold">Carrinho</h2>

          <p className="mt-2 text-sm text-neutral-500">
            Confira os produtos adicionados.
          </p>
        </Link>

        <div className="border border-neutral-200 p-6 sm:col-span-2">
          <h2 className="font-semibold">Pedidos</h2>

          {(orders ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">
              Você ainda não realizou nenhum pedido.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {(orders ?? []).map((order) => (
                <Link
                  key={order.id}
                  href={`/minha-conta/pedidos/${order.id}`}
                  className="flex flex-col gap-3 border border-neutral-200 p-4 transition hover:border-neutral-950 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Pedido #{order.id.slice(0, 8)}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm">
                      {getStatusLabel(order.status)}
                    </span>

                    <span className="font-medium">
                      {formatPrice(Number(order.total))}
                    </span>

                    <span className="text-sm text-neutral-400">
                      Ver detalhes →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="border border-neutral-200 p-6 sm:col-span-2">
          <h2 className="font-semibold">Dados da conta</h2>

          <p className="mt-2 text-sm text-neutral-500">E-mail: {user.email}</p>
        </div>
      </div>
    </section>
  );
}
