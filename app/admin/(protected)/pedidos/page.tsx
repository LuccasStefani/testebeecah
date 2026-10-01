import { adminContent } from "@/src/content/admin";
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
      return adminContent.aprovado;

    case "pending":
      return adminContent.pendente;

    case "rejected":
      return adminContent.recusado;

    case "cancelled":
      return adminContent.cancelado;

    case "refunded":
      return adminContent.reembolsado;

    case "expired":
      return adminContent.expirado;

    default:
      return status;
  }
}

function getStatusClassName(status: string) {
  switch (status) {
    case "approved":
      return "text-green-700";

    case "pending":
      return "text-amber-600";

    case "rejected":
    case "cancelled":
      return "text-red-600";

    case "refunded":
      return "text-blue-600";

    case "expired":
      return "text-neutral-500";

    default:
      return "text-neutral-700";
  }
}

type PageProps = {
  searchParams: Promise<{
    status?: string;
    busca?: string;
    cliente?: string;
  }>;
};

const validStatuses = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "refunded",
  "expired",
];

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    redirect("/admin/login");
  }

  const params = await searchParams;

  const selectedStatus =
    typeof params.status === "string" && validStatuses.includes(params.status)
      ? params.status
      : "";

  const search = typeof params.busca === "string" ? params.busca.trim() : "";

  let ordersQuery = supabaseAdmin
    .from("orders")
    .select(
      "\n      id,\n      user_id,\n      status,\n      total,\n      mercado_pago_payment_id,\n      created_at,\n      order_items (\n        id,\n        product_name,\n        unit_price,\n        quantity,\n        subtotal\n      )\n    ",
    )
    .order("created_at", {
      ascending: false,
    });

  const customerId =
    typeof params.cliente === "string" && /^[0-9a-f-]{36}$/i.test(params.cliente)
      ? params.cliente
      : "";
  if (customerId) ordersQuery = ordersQuery.eq("user_id", customerId);

  if (selectedStatus) {
    ordersQuery = ordersQuery.eq("status", selectedStatus);
  }

  const { data: orders, error: ordersError } = await ordersQuery;

  if (ordersError) {
    console.error(adminContent.erroAoCarregarPedidosDoAdmin, ordersError);
  }

  const userIds = [...new Set((orders ?? []).map((order) => order.user_id))];

  const usersById = new Map<string, string>();

  for (const userId of userIds) {
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError) {
      console.error(adminContent.erroAoCarregarUsuarioDoPedido, userId, userError);

      continue;
    }

    if (userData.user) {
      usersById.set(userId, userData.user.email ?? adminContent.eMailNaoDisponivel);
    }
  }

  const normalizedSearch = search.toLowerCase();

  const filteredOrders = (orders ?? []).filter((order) => {
    if (!normalizedSearch) {
      return true;
    }

    const customerEmail = usersById.get(order.user_id) ?? "";

    const paymentId = order.mercado_pago_payment_id ?? "";

    return (
      order.id.toLowerCase().includes(normalizedSearch) ||
      customerEmail.toLowerCase().includes(normalizedSearch) ||
      paymentId.toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div>
        <Link
          href="/admin"
          className="text-sm text-neutral-500 transition hover:text-neutral-950"
        >
          {adminContent.painel}
        </Link>

        <h1 className="mt-4 text-3xl font-semibold">{adminContent.pedidos}</h1>

        <p className="mt-2 text-neutral-500">
          {adminContent.acompanheOsPedidosRealizadosNaBeecah}
        </p>
      </div>

      <form
        method="GET"
        className="mt-8 grid gap-4 border border-neutral-200 bg-white p-5 md:grid-cols-[1fr_220px_auto]"
      >
        {customerId && (
          <>
            <input type="hidden" name="cliente" value={customerId} />
            <p className="md:col-span-3 text-sm text-violet-700">
              {adminContent.pedidosDoClienteSelecionado}
              <Link href="/admin/clientes" className="underline">
                {adminContent.voltarAosClientes}
              </Link>
              {" · "}
              <Link href="/admin/pedidos" className="underline">
                {adminContent.verTodosOsPedidos}
              </Link>
            </p>
          </>
        )}
        <div>
          <label
            htmlFor="busca"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-neutral-500"
          >
            {adminContent.buscar}
          </label>

          <input
            id="busca"
            name="busca"
            type="text"
            defaultValue={search}
            placeholder={adminContent.pedidoEMailOuPagamento}
            className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-950"
          />
        </div>

        <div>
          <label
            htmlFor="status"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-neutral-500"
          >
            {adminContent.status}
          </label>

          <select
            id="status"
            name="status"
            defaultValue={selectedStatus}
            className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-950"
          >
            <option value="">{adminContent.todos}</option>

            <option value="pending">{adminContent.pendentes}</option>

            <option value="approved">{adminContent.aprovados}</option>

            <option value="rejected">{adminContent.recusados}</option>

            <option value="cancelled">{adminContent.cancelados}</option>

            <option value="refunded">{adminContent.reembolsados}</option>

            <option value="expired">{adminContent.expirados}</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            {adminContent.filtrar}
          </button>

          {(search || selectedStatus) && (
            <Link
              href="/admin/pedidos"
              className="border border-neutral-300 px-5 py-3 text-sm font-medium transition hover:border-neutral-950"
            >
              {adminContent.limpar}
            </Link>
          )}
        </div>
      </form>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {filteredOrders.length}{" "}
          {filteredOrders.length === 1
            ? adminContent.pedidoEncontrado
            : adminContent.pedidosEncontrados}
        </p>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="mt-6 border border-neutral-200 bg-white p-10 text-center">
          <p className="text-neutral-500">{adminContent.nenhumPedidoEncontrado}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {filteredOrders.map((order) => {
            const customerEmail =
              usersById.get(order.user_id) ?? adminContent.clienteNaoIdentificado;

            return (
              <article key={order.id} className="border border-neutral-200 bg-white">
                <div className="flex flex-col gap-5 border-b border-neutral-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium">
                      {adminContent.pedido}
                      {order.id.slice(0, 8)}
                    </p>

                    <p className="mt-1 text-sm text-neutral-500">{customerEmail}</p>

                    <p className="mt-1 text-xs text-neutral-400">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-400">
                        {adminContent.status}
                      </p>

                      <p
                        className={`mt-1 text-sm font-medium ${getStatusClassName(
                          order.status,
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-400">
                        {adminContent.total}
                      </p>

                      <p className="mt-1 font-semibold">
                        {formatPrice(Number(order.total))}
                      </p>
                    </div>

                    {order.mercado_pago_payment_id && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-neutral-400">
                          {adminContent.pagamento}
                        </p>

                        <p className="mt-1 text-sm">{order.mercado_pago_payment_id}</p>
                      </div>
                    )}

                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="text-sm font-medium underline underline-offset-4"
                    >
                      {adminContent.verDetalhes}
                    </Link>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm font-medium">{adminContent.itens}</p>

                  <div className="mt-4 space-y-3">
                    {(order.order_items ?? []).map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 border-b border-neutral-100 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.product_name}</p>

                          <p className="mt-1 text-xs text-neutral-500">
                            {item.quantity}
                            {adminContent.symbol2} {formatPrice(Number(item.unit_price))}
                          </p>
                        </div>

                        <p className="text-sm font-medium">
                          {formatPrice(Number(item.subtotal))}
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
