import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export default async function CheckoutDeliveryPage() {
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
  ]);

  if (profileError) {
    console.error(
      "Erro ao carregar perfil no checkout:",
      profileError
    );
  }

  if (addressesError) {
    console.error(
      "Erro ao carregar endereços no checkout:",
      addressesError
    );
  }

  const hasPersonalData =
    Boolean(profile?.full_name?.trim()) &&
    Boolean(profile?.phone?.trim());

  const addressList = addresses ?? [];

  if (
    !hasPersonalData ||
    addressList.length === 0
  ) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Checkout
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Complete seus dados
        </h1>

        <p className="mt-3 text-neutral-600">
          Para continuar a compra, precisamos dos seus
          dados pessoais e de um endereço de entrega.
        </p>

        <div className="mt-8 space-y-4">
          {!hasPersonalData && (
            <div className="border border-neutral-200 p-5">
              <h2 className="font-semibold">
                Dados pessoais
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                Informe seu nome e telefone.
              </p>

              <Link
                href="/minha-conta/dados"
                className="mt-4 inline-block bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Completar dados
              </Link>
            </div>
          )}

          {addressList.length === 0 && (
            <div className="border border-neutral-200 p-5">
              <h2 className="font-semibold">
                Endereço de entrega
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                Cadastre um endereço para receber seu pedido.
              </p>

              <Link
                href="/minha-conta/enderecos/novo"
                className="mt-4 inline-block bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Adicionar endereço
              </Link>
            </div>
          )}
        </div>

        <Link
          href="/carrinho"
          className="mt-8 inline-block text-sm text-neutral-500 underline underline-offset-4"
        >
          ← Voltar ao carrinho
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Checkout
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Confirme seu endereço de entrega
        </h1>

        <p className="mt-2 text-neutral-500">
          Escolha onde deseja receber seu pedido.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {addressList.map((address) => (
          <div
            key={address.id}
            className="border border-neutral-200 p-5"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-semibold">
                    {address.label || "Endereço"}
                  </p>

                  {address.is_default && (
                    <span className="text-xs font-medium uppercase tracking-wider text-green-700">
                      Principal
                    </span>
                  )}
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

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/minha-conta/enderecos/${address.id}/editar`}
                  className="border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-neutral-950"
                >
                  Editar
                </Link>

                <Link
                  href={`/checkout/entrega/${address.id}`}
                  className="bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  Entregar neste endereço
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Link
          href="/minha-conta/enderecos/novo"
          className="text-sm font-medium underline underline-offset-4"
        >
          + Adicionar outro endereço
        </Link>
      </div>

      <Link
        href="/carrinho"
        className="mt-8 inline-block text-sm text-neutral-500 underline underline-offset-4"
      >
        ← Voltar ao carrinho
      </Link>
    </section>
  );
}