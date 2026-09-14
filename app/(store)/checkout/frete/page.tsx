import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    address?: string;
  }>;
};

export default async function CheckoutShippingPage({
  searchParams,
}: PageProps) {
  const { address: addressId } =
    await searchParams;

  if (!addressId) {
    redirect("/checkout/entrega");
  }

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
    error: addressError,
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
    .eq("id", addressId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (addressError) {
    console.error(
      "Erro ao carregar endereço no frete:",
      addressError
    );
  }

  if (!address) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href={`/checkout/entrega/${address.id}`}
        className="text-sm text-neutral-500 transition hover:text-neutral-950"
      >
        ← Voltar para o endereço
      </Link>

      <div className="mt-6">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Checkout
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Escolha o frete
        </h1>

        <p className="mt-2 text-neutral-500">
          Selecione a melhor opção de entrega para o seu pedido.
        </p>
      </div>

      <div className="mt-8 border border-neutral-200 p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-400">
          Entregar em
        </p>

        <p className="mt-2 font-semibold">
          {address.recipient_name}
        </p>

        <div className="mt-2 text-sm leading-6 text-neutral-600">
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
        </div>
      </div>

      <div className="mt-8 border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold">
          Opções de entrega
        </h2>

        <p className="mt-2 text-sm text-neutral-500">
          As opções de frete aparecerão aqui após a integração
          com o Melhor Envio.
        </p>

        <div className="mt-6 border border-dashed border-neutral-300 bg-neutral-50 p-5">
          <p className="text-sm font-medium">
            Integração pendente
          </p>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Vamos consultar o Melhor Envio usando o CEP{" "}
            <strong>{address.zip_code}</strong>,
            os produtos do carrinho e as dimensões/peso da embalagem.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/checkout/entrega/${address.id}`}
          className="border border-neutral-300 px-5 py-3 text-sm font-medium transition hover:border-neutral-950"
        >
          Alterar endereço
        </Link>

        <button
          type="button"
          disabled
          className="cursor-not-allowed bg-neutral-300 px-5 py-3 text-sm font-medium text-white"
        >
          Continuar para pagamento
        </button>
      </div>
    </section>
  );
}