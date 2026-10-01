import { checkoutContent } from "@/src/content/checkout";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    address?: string;
  }>;
};

export default async function CheckoutShippingPage({ searchParams }: PageProps) {
  const { address: addressId } = await searchParams;

  if (!addressId) {
    redirect("/checkout/entrega");
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: address, error: addressError } = await supabase
    .from("addresses")
    .select(
      "\n      id,\n      label,\n      recipient_name,\n      phone,\n      zip_code,\n      street,\n      number,\n      complement,\n      neighborhood,\n      city,\n      state,\n      is_default\n    ",
    )
    .eq("id", addressId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (addressError) {
    console.error(checkoutContent.erroAoCarregarEnderecoNoFrete, addressError);
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
        {checkoutContent.voltarParaOEndereco}
      </Link>

      <div className="mt-6">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          {checkoutContent.checkout}
        </p>

        <h1 className="mt-3 text-3xl font-semibold">{checkoutContent.escolhaOFrete}</h1>

        <p className="mt-2 text-neutral-500">
          {checkoutContent.selecioneAMelhorOpcaoDeEntregaParaO}
        </p>
      </div>

      <div className="mt-8 border border-neutral-200 p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-400">
          {checkoutContent.entregarEm}
        </p>

        <p className="mt-2 font-semibold">{address.recipient_name}</p>

        <div className="mt-2 text-sm leading-6 text-neutral-600">
          <p>
            {address.street}
            {","} {address.number}
            {address.complement ? ` - ${address.complement}` : ""}
          </p>

          <p>{address.neighborhood}</p>

          <p>
            {address.city}
            {" -"} {address.state}
          </p>

          <p>
            {checkoutContent.cep}
            {address.zip_code}
          </p>
        </div>
      </div>

      <div className="mt-8 border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold">{checkoutContent.opcoesDeEntrega}</h2>

        <p className="mt-2 text-sm text-neutral-500">
          {checkoutContent.asOpcoesDeFreteApareceraoAquiAposA}
        </p>

        <div className="mt-6 border border-dashed border-neutral-300 bg-neutral-50 p-5">
          <p className="text-sm font-medium">{checkoutContent.integracaoPendente}</p>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            {checkoutContent.vamosConsultarOMelhorEnvioUsandoOCep}{" "}
            <strong>{address.zip_code}</strong>
            {checkoutContent.osProdutosDoCarrinhoEAsDimensoesPeso}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/checkout/entrega/${address.id}`}
          className="border border-neutral-300 px-5 py-3 text-sm font-medium transition hover:border-neutral-950"
        >
          {checkoutContent.alterarEndereco}
        </Link>

        <button
          type="button"
          disabled
          className="cursor-not-allowed bg-neutral-300 px-5 py-3 text-sm font-medium text-white"
        >
          {checkoutContent.continuarParaPagamento}
        </button>
      </div>
    </section>
  );
}
