import Link from "next/link";
import { redirect } from "next/navigation";

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

    default:
      return status;
  }
}

export default async function AdminOrdersPage() {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    redirect("/admin/login");
  }

  const {
    data: orders,
    error: ordersError,
  } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      user_id,
      status,
      total,
      mercado_pago_payment_id,
      created_at,
      order_items (
        id,
        product_name,
        unit_price,
        quantity,
        subtotal
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (ordersError) {
    console.error(
      "Erro ao carregar pedidos do admin:",
      ordersError
    );
  }

  const userIds = [
    ...new Set(
      (orders ?? []).map(
        (order) => order.user_id
      )
    ),
  ];

  const usersById = new Map<
    string,
    string
  >();

  for (const userId of userIds) {
    const {
      data: userData,
      error: userError,
    } =
      await supabaseAdmin.auth.admin.getUserById(
        userId
      );

    if (userError) {
      console.error(
        "Erro ao carregar usuário do pedido:",
        userId,
        userError
      );

      continue;
    }

    if (userData.user) {
      usersById.set(
        userId,
        userData.user.email ??
          "E-mail não disponível"
      );
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div>
        <Link
          href="/admin"
          className="text-sm text-neutral-500 transition hover:text-neutral-950"
        >
          ← Painel
        </Link>

        <h1 className="mt-4 text-3xl font-semibold">
          Pedidos
        </h1>

        <p className="mt-2 text-neutral-500">
          Acompanhe os pedidos realizados na Beecah.
        </p>
      </div>

      {(orders ?? []).length === 0 ? (
        <div className="mt-10 border border-neutral-200 p-10 text-center">
          <p className="text-neutral-500">
            Nenhum pedido realizado ainda.
          </p>
        </div>
      ) : (
        <div className="mt-10 space-y-5">
          {(orders ?? []).map((order) => {
            const customerEmail =
              usersById.get(order.user_id) ??
              "Cliente não identificado";

            return (
              <article
                key={order.id}
                className="border border-neutral-200"
              >
                <div className="flex flex-col gap-5 border-b border-neutral-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium">
                      Pedido #{order.id.slice(0, 8)}
                    </p>

                    <p className="mt-1 text-sm text-neutral-500">
                      {customerEmail}
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-400">
                        Status
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {getStatusLabel(
                          order.status
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-400">
                        Total
                      </p>

                      <p className="mt-1 font-semibold">
                        {formatPrice(
                          Number(order.total)
                        )}
                      </p>
                    </div>

                    {order.mercado_pago_payment_id && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-neutral-400">
                          Pagamento
                        </p>

                        <p className="mt-1 text-sm">
                          {
                            order.mercado_pago_payment_id
                          }
                        </p>
                      </div>
                    )}

                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="text-sm font-medium underline underline-offset-4"
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm font-medium">
                    Itens
                  </p>

                  <div className="mt-4 space-y-3">
                    {(
                      order.order_items ?? []
                    ).map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 border-b border-neutral-100 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {
                              item.product_name
                            }
                          </p>

                          <p className="mt-1 text-xs text-neutral-500">
                            {item.quantity} ×{" "}
                            {formatPrice(
                              Number(
                                item.unit_price
                              )
                            )}
                          </p>
                        </div>

                        <p className="text-sm font-medium">
                          {formatPrice(
                            Number(
                              item.subtotal
                            )
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}