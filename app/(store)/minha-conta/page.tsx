import { accountContent } from "@/src/content/account";
import { accountStyles } from "@/src/styles/account";
import Link from "next/link";
import Image from "next/image";
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
      return accountContent.aprovado;

    case "pending":
      return accountContent.pendente;

    case "rejected":
      return accountContent.recusado;

    case "cancelled":
      return accountContent.cancelado;

    case "refunded":
      return accountContent.reembolsado;

    case "expired":
      return accountContent.expirado;

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

  const [
    { data: profile, error: profileError },
    { data: addresses, error: addressesError },
    { data: orders, error: ordersError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(accountContent.fullNamePhone2)
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("addresses")
      .select(
        "\n        id,\n        label,\n        recipient_name,\n        phone,\n        zip_code,\n        street,\n        number,\n        complement,\n        neighborhood,\n        city,\n        state,\n        is_default\n      ",
      )
      .eq("user_id", user.id)
      .order("is_default", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("orders")
      .select(
        "\n        id,\n        status,\n        total,\n        created_at\n      ",
      )
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      }),
  ]);

  if (profileError) {
    console.error(accountContent.erroAoCarregarPerfil, profileError);
  }

  if (addressesError) {
    console.error(accountContent.erroAoCarregarEnderecos, addressesError);
  }

  if (ordersError) {
    console.error(accountContent.erroAoCarregarPedidos, ordersError);
  }

  return (
    <section className={accountStyles.accountOverview}>
      <header className={accountStyles.accountIntro}>
        <div className={accountStyles.accountIntroImage}>
          <Image
            src="/images/banners/bghero2.jpg"
            alt={""}
            fill
            sizes="(max-width: 767px) 100vw, 800px"
            className="object-cover object-[65%_center]"
            priority
          />
        </div>
        <div className={accountStyles.accountIntroCopy}>
          <p className={accountStyles.accountEyebrow}>
            {accountContent.seuEspacoNaBeecah}
          </p>
          <h1>
            {accountContent.ola}
            {profile?.full_name ? ", " + profile.full_name.split(" ")[0] : ""}
            {"."}
          </h1>
          <p>{accountContent.tudoSobreSeusPedidosEmUmSoLugar}</p>
        </div>
      </header>
      <section id="pedidos" className={accountStyles.accountPanel}>
        <div className={accountStyles.accountSectionTitle}>
          <div>
            <p className={accountStyles.accountEyebrow}>
              {accountContent.historicoDeCompras}
            </p>
            <h2>{accountContent.meusPedidos}</h2>
          </div>
          <span className={accountStyles.accountCount}>
            {ordersError ? "—" : (orders ?? []).length}
          </span>
        </div>
        {ordersError ? (
          <p role="alert" className={accountStyles.accountNotice}>
            {accountContent.naoFoiPossivelCarregarSeusPedidosAtualizeA}
          </p>
        ) : !orders?.length ? (
          <div className={accountStyles.accountEmpty}>
            <h3>{accountContent.aindaNaoHaPedidosPorAqui}</h3>
            <p>{accountContent.encontreSeuProximoPerfumeDepoisDaCompraAcompanhe}</p>
            <Link className={accountStyles.accountPrimary} href="/perfumes">
              {accountContent.explorarPerfumes}
              <span aria-hidden="true">{"↗"}</span>
            </Link>
          </div>
        ) : (
          <div className={accountStyles.accountOrders}>
            {orders.map((order) => (
              <Link
                key={order.id}
                href={"/minha-conta/pedidos/" + order.id}
                className={accountStyles.accountOrder}
              >
                <div>
                  <strong>
                    {accountContent.pedido}
                    {order.id.slice(0, 8)}
                  </strong>
                  <p>{formatDate(order.created_at)}</p>
                </div>
                <span
                  className={
                    [accountStyles.accountStatus, "status-"].join(" ") + order.status
                  }
                >
                  {accountContent.pagamento}
                  {getStatusLabel(order.status)}
                </span>
                <strong>{formatPrice(Number(order.total))}</strong>
                <span className={accountStyles.accountOrderAction}>
                  {accountContent.verDetalhes}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className={accountStyles.accountPanel}>
        <div className={accountStyles.accountSectionTitle}>
          <div>
            <p className={accountStyles.accountEyebrow}>
              {accountContent.informacoesPessoais}
            </p>
            <h2>{accountContent.dadosDaConta}</h2>
          </div>
          <Link className={accountStyles.accountTextLink} href="/minha-conta/dados">
            {accountContent.editarDados}
          </Link>
        </div>
        {profileError ? (
          <p role="alert" className={accountStyles.accountNotice}>
            {accountContent.naoFoiPossivelCarregarSeusDadosAtualizeA}
          </p>
        ) : (
          <dl className={accountStyles.accountDetails}>
            <div>
              <dt>{accountContent.nomeCompleto}</dt>
              <dd>{profile?.full_name || accountContent.naoInformado}</dd>
            </div>
            <div>
              <dt>{accountContent.eMail}</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>{accountContent.telefone}</dt>
              <dd>{profile?.phone || accountContent.naoInformado}</dd>
            </div>
          </dl>
        )}
      </section>
      <section id="enderecos" className={accountStyles.accountPanel}>
        <div className={accountStyles.accountSectionTitle}>
          <div>
            <p className={accountStyles.accountEyebrow}>
              {accountContent.paraReceberSeusPerfumes}
            </p>
            <h2>{accountContent.enderecos}</h2>
          </div>
          <Link
            className={accountStyles.accountTextLink}
            href="/minha-conta/enderecos/novo"
          >
            {accountContent.adicionarEndereco2}
          </Link>
        </div>
        {addressesError ? (
          <p role="alert" className={accountStyles.accountNotice}>
            {accountContent.naoFoiPossivelCarregarSeusEnderecosAtualizeA}
          </p>
        ) : !addresses?.length ? (
          <div
            className={[accountStyles.accountEmpty, accountStyles.accountEmptySmall].join(
              " ",
            )}
          >
            <h3>{accountContent.ondeVamosEntregar}</h3>
            <p>{accountContent.salveSeuEnderecoEAgilizeSuaProximaCompra}</p>
            <Link
              className={accountStyles.accountTextLink}
              href="/minha-conta/enderecos/novo"
            >
              {accountContent.cadastrarMeuEndereco}
            </Link>
          </div>
        ) : (
          <div className={accountStyles.accountAddresses}>
            {addresses.map((address) => (
              <article key={address.id} className={accountStyles.accountAddress}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3>{address.label || accountContent.endereco}</h3>
                  {address.is_default && (
                    <span className={accountStyles.accountStatus}>
                      {accountContent.principal}
                    </span>
                  )}
                </div>
                <p className="mt-5 font-medium">{address.recipient_name}</p>
                <p>
                  {address.street}
                  {", "}
                  {address.number}
                  {address.complement ? " — " + address.complement : ""}
                </p>
                <p>
                  {address.neighborhood}
                  {" · "}
                  {address.city}
                  {"/"}
                  {address.state}
                </p>
                <p>
                  {accountContent.cep2}
                  {address.zip_code}
                </p>
                <p>{address.phone}</p>
                <Link
                  className={[accountStyles.accountTextLink, "mt-5", "inline-flex"].join(
                    " ",
                  )}
                  aria-label={
                    accountContent.editarEndereco2 + (address.label || address.street)
                  }
                  href={"/minha-conta/enderecos/" + address.id + "/editar"}
                >
                  {accountContent.editarEndereco3}
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
      <div className={accountStyles.accountHelp}>
        <p>{accountContent.precisaDeAjudaComUmPedido}</p>
        <Link className={accountStyles.accountTextLink} href="/atendimento">
          {accountContent.faleComABeecah}
        </Link>
      </div>
    </section>
  );
}
