import { adminContent } from "@/src/content/admin";
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

function formatZipCode(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length !== 8) {
    return value;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
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
      "\n        id,\n        user_id,\n        status,\n        subtotal,\n        shipping_price,\n        shipping_service_id,\n        shipping_service_name,\n        shipping_company_id,\n        shipping_company_name,\n        shipping_delivery_min,\n        shipping_delivery_max,\n        total,\n        mercado_pago_preference_id,\n        mercado_pago_payment_id,\n        created_at,\n        updated_at,\n        order_items (\n          id,\n          product_id,\n          product_name,\n          unit_price,\n          quantity,\n          subtotal\n        )\n      ",
    )
    .eq("id", id)
    .single();

  if (orderError || !order) {
    notFound();
  }

  const [
    { data: userData, error: userError },
    { data: shippingAddress, error: shippingAddressError },
  ] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(order.user_id),

    supabaseAdmin
      .from("order_shipping_addresses")
      .select(
        "\n        id,\n        recipient_name,\n        phone,\n        zip_code,\n        street,\n        number,\n        complement,\n        neighborhood,\n        city,\n        state,\n        created_at\n      ",
      )
      .eq("order_id", order.id)
      .maybeSingle(),
  ]);

  if (userError) {
    console.error(adminContent.erroAoCarregarClienteDoPedido, userError);
  }

  if (shippingAddressError) {
    console.error(
      adminContent.erroAoCarregarEnderecoDeEntregaDoPedido,
      shippingAddressError,
    );
  }

  const customerEmail = userData?.user?.email ?? adminContent.eMailNaoDisponivel;

  const subtotal =
    order.subtotal !== null
      ? Number(order.subtotal)
      : (order.order_items ?? []).reduce(
          (total, item) => total + Number(item.subtotal),
          0,
        );

  const shippingPrice = order.shipping_price !== null ? Number(order.shipping_price) : 0;

  const hasShipping =
    order.shipping_service_name ||
    order.shipping_company_name ||
    order.shipping_price !== null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/admin/pedidos"
        className="text-sm text-neutral-500 transition hover:text-neutral-950"
      >
        {adminContent.pedidos2}
      </Link>

      <div className="mt-6">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          {adminContent.pedido}
          {order.id.slice(0, 8)}
        </p>

        <h1 className="mt-3 text-3xl font-semibold">{adminContent.detalhesDoPedido}</h1>

        <p className="mt-2 text-sm text-neutral-500">
          {adminContent.realizadoEm}
          {formatDate(order.created_at)}
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="border border-neutral-200 p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-400">
            {adminContent.cliente}
          </p>

          <p className="mt-2 font-medium">{customerEmail}</p>
        </div>

        <div className="border border-neutral-200 p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-400">
            {adminContent.status}
          </p>

          <p className="mt-2 text-lg font-semibold">{getStatusLabel(order.status)}</p>
        </div>

        <div className="border border-neutral-200 p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-400">
            {adminContent.total}
          </p>

          <p className="mt-2 text-lg font-semibold">{formatPrice(Number(order.total))}</p>
        </div>

        <div className="border border-neutral-200 p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-400">
            {adminContent.ultimaAtualizacao}
          </p>

          <p className="mt-2 text-sm">{formatDate(order.updated_at)}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">{adminContent.enderecoDeEntrega}</h2>

          {shippingAddress ? (
            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="font-semibold">{shippingAddress.recipient_name}</p>

                <p className="mt-1 text-neutral-600">{shippingAddress.phone}</p>
              </div>

              <div className="leading-6 text-neutral-700">
                <p>
                  {shippingAddress.street}
                  {","} {shippingAddress.number}
                </p>

                {shippingAddress.complement && <p>{shippingAddress.complement}</p>}

                <p>{shippingAddress.neighborhood}</p>

                <p>
                  {shippingAddress.city}
                  {" -"} {shippingAddress.state}
                </p>

                <p>
                  {adminContent.cep} {formatZipCode(shippingAddress.zip_code)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">
              {adminContent.estePedidoNaoPossuiUmEnderecoDeEntrega}
            </p>
          )}
        </div>

        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">{adminContent.entrega}</h2>

          {hasShipping ? (
            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-neutral-500">{adminContent.transportadora}</p>

                <p className="mt-1 font-semibold">
                  {order.shipping_company_name ?? adminContent.naoInformada}
                </p>
              </div>

              <div>
                <p className="text-neutral-500">{adminContent.servico}</p>

                <p className="mt-1">
                  {order.shipping_service_name ?? adminContent.naoInformado}
                </p>
              </div>

              <div>
                <p className="text-neutral-500">{adminContent.valorDoFrete}</p>

                <p className="mt-1 font-medium">{formatPrice(shippingPrice)}</p>
              </div>

              {order.shipping_delivery_min !== null &&
                order.shipping_delivery_max !== null && (
                  <div>
                    <p className="text-neutral-500">{adminContent.prazoEstimado}</p>

                    <p className="mt-1">
                      {order.shipping_delivery_min === order.shipping_delivery_max
                        ? `${order.shipping_delivery_min} dias úteis`
                        : `${order.shipping_delivery_min} a ${order.shipping_delivery_max} dias úteis`}
                    </p>
                  </div>
                )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">
              {adminContent.informacoesDeFreteNaoDisponiveisParaEstePedido}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 border border-neutral-200">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="text-lg font-semibold">{adminContent.itensDoPedido}</h2>
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
                  {item.quantity}
                  {adminContent.symbol2} {formatPrice(Number(item.unit_price))}
                </p>
              </div>

              <p className="font-semibold">{formatPrice(Number(item.subtotal))}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t border-neutral-200 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">{adminContent.subtotal}</span>

            <span>{formatPrice(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">{adminContent.frete}</span>

            <span>{formatPrice(shippingPrice)}</span>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-200 pt-3 font-semibold">
            <span>{adminContent.total}</span>

            <span>{formatPrice(Number(order.total))}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 border border-neutral-200 p-6">
        <h2 className="font-semibold">{adminContent.mercadoPago}</h2>

        <div className="mt-4 space-y-3 text-sm">
          <div>
            <p className="text-neutral-500">{adminContent.preferenceId}</p>

            <p className="mt-1 break-all">
              {order.mercado_pago_preference_id ?? adminContent.naoDisponivel}
            </p>
          </div>

          <div>
            <p className="text-neutral-500">{adminContent.paymentId}</p>

            <p className="mt-1 break-all">
              {order.mercado_pago_payment_id ?? adminContent.naoDisponivel}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
