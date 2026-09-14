import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CheckoutSelectedAddressPage({
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
    data: address,
    error,
  } = await supabase
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
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao carregar endereço escolhido:",
      error
    );
  }

  if (!address) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/checkout/entrega"
        className="text-sm text-neutral-500 transition hover:text-neutral-950"
      >
        ← Escolher outro endereço
      </Link>

      <div className="mt-6">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Checkout
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Confirmar entrega
        </h1>

        <p className="mt-2 text-neutral-500">
          Confira o endereço selecionado antes de continuar.
        </p>
      </div>

      <div className="mt-8 border border-neutral-200 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-semibold">
            {address.label || "Endereço"}
          </h2>

          {address.is_default && (
            <span className="text-xs font-medium uppercase tracking-wider text-green-700">
              Principal
            </span>
          )}
        </div>

        <div className="mt-5 space-y-1 text-sm text-neutral-600">
          <p className="font-medium text-neutral-950">
            {address.recipient_name}
          </p>

          <p>
            {address.street}, {address.number}
            {address.complement
              ? ` - ${address.complement}`
              : ""}
          </p>

          <p>
            {address.neighborhood}
          </p>

          <p>
            {address.city} - {address.state}
          </p>

          <p>
            CEP {address.zip_code}
          </p>

          <p>
            {address.phone}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/minha-conta/enderecos/${address.id}/editar`}
            className="border border-neutral-300 px-5 py-3 text-sm font-medium transition hover:border-neutral-950"
          >
            Editar endereço
          </Link>

          <Link
            href={`/checkout/frete?address=${address.id}`}
            className="bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Continuar para o frete
          </Link>
        </div>
      </div>

      <div className="mt-8 border border-neutral-200 bg-neutral-50 p-5">
        <p className="text-sm font-medium">
          Próxima etapa
        </p>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Na próxima tela vamos calcular as opções de entrega
          para o CEP {address.zip_code} e permitir que você
          escolha a modalidade de frete antes do pagamento.
        </p>
      </div>
    </section>
  );
}