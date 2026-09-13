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
  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: profile, error: profileError },
    { data: addresses, error: addressesError },
    { data: orders, error: ordersError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(`
        full_name,
        phone
      `)
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("addresses")
      .select(`
        id,
        label,
        recipient_name,
        phone,
        zip_code,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        is_default
      `)
      .eq("user_id", user.id)
      .order("is_default", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("orders")
      .select(`
        id,
        status,
        total,
        created_at
      `)
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      }),
  ]);

  if (profileError) {
    console.error(
      "Erro ao carregar perfil:",
      profileError
    );
  }

  if (addressesError) {
    console.error(
      "Erro ao carregar endereços:",
      addressesError
    );
  }

  if (ordersError) {
    console.error(
      "Erro ao carregar pedidos:",
      ordersError
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Minha conta
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Olá
          {profile?.full_name
            ? `, ${profile.full_name}`
            : ""}
        </h1>

        <p className="mt-2 text-neutral-500">
          {user.email}
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/favoritos"
          className="border border-neutral-200 p-6 transition hover:border-neutral-950"
        >
          <h2 className="font-semibold">
            Favoritos
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Veja os perfumes que você salvou.
          </p>
        </Link>

        <Link
          href="/carrinho"
          className="border border-neutral-200 p-6 transition hover:border-neutral-950"
        >
          <h2 className="font-semibold">
            Carrinho
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Confira os produtos adicionados.
          </p>
        </Link>

        <div className="border border-neutral-200 p-6 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">
                Dados da conta
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                Informações usadas nos seus pedidos.
              </p>
            </div>

            <Link
              href="/minha-conta/dados"
              className="border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-neutral-950"
            >
              Editar dados
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-400">
                Nome
              </p>

              <p className="mt-1 text-sm font-medium">
                {profile?.full_name ??
                  "Não informado"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-400">
                Telefone
              </p>

              <p className="mt-1 text-sm font-medium">
                {profile?.phone ??
                  "Não informado"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-400">
                E-mail
              </p>

              <p className="mt-1 text-sm font-medium">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        <div className="border border-neutral-200 p-6 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">
                Endereços
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                Endereços disponíveis para entrega.
              </p>
            </div>

            <Link
              href="/minha-conta/enderecos/novo"
              className="bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Adicionar endereço
            </Link>
          </div>

          {(addresses ?? []).length === 0 ? (
            <p className="mt-5 text-sm text-neutral-500">
              Você ainda não cadastrou nenhum endereço.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(addresses ?? []).map(
                (address) => (
                  <div
                    key={address.id}
                    className="border border-neutral-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          {address.label ||
                            "Endereço"}
                        </p>

                        {address.is_default && (
                          <p className="mt-1 text-xs font-medium uppercase tracking-wider text-green-700">
                            Principal
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/minha-conta/enderecos/${address.id}/editar`}
                        className="text-sm underline underline-offset-4"
                      >
                        Editar
                      </Link>
                    </div>

                    <div className="mt-4 space-y-1 text-sm text-neutral-600">
                      <p>
                        {address.recipient_name}
                      </p>

                      <p>
                        {address.street},{" "}
                        {address.number}
                        {address.complement
                          ? ` - ${address.complement}`
                          : ""}
                      </p>

                      <p>
                        {address.neighborhood}
                      </p>

                      <p>
                        {address.city} -{" "}
                        {address.state}
                      </p>

                      <p>
                        CEP {address.zip_code}
                      </p>

                      <p>
                        {address.phone}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="border border-neutral-200 p-6 sm:col-span-2">
          <h2 className="font-semibold">
            Pedidos
          </h2>

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
                      Pedido #
                      {order.id.slice(0, 8)}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      {formatDate(
                        order.created_at
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm">
                      {getStatusLabel(
                        order.status
                      )}
                    </span>

                    <span className="font-medium">
                      {formatPrice(
                        Number(order.total)
                      )}
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
      </div>
    </section>
  );
}