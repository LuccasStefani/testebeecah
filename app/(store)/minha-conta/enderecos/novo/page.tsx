"use client";

import { accountContent } from "@/src/content/account";
import { accountStyles } from "@/src/styles/account";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/src/lib/supabase/client";

export default function NewAddressPage() {
  const router = useRouter();

  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [label, setLabel] = useState<string>(accountContent.casa);
  const [isDefault, setIsDefault] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select(accountContent.fullNamePhone)
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.full_name) {
        setRecipientName(profile.full_name);
      }

      if (profile?.phone) {
        setPhone(profile.phone);
      }

      const { count } = await supabase
        .from("addresses")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id);

      /*
       * Primeiro endereço:
       * já deixamos como principal.
       *
       * Se já existir algum endereço,
       * o cliente poderá decidir.
       */
      setIsDefault((count ?? 0) === 0);

      setLoading(false);
    }

    loadData().catch(() => {
      setErrorMessage(accountContent.naoFoiPossivelCarregarOsDadosAtualizeA);
      setLoading(false);
    });
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const normalizedRecipient = recipientName.trim();

    const normalizedPhone = phone.trim();

    const normalizedZip = zipCode.replace(/\D/g, "");

    const normalizedStreet = street.trim();

    const normalizedNumber = number.trim();

    const normalizedNeighborhood = neighborhood.trim();

    const normalizedCity = city.trim();

    const normalizedState = state.trim().toUpperCase();

    if (!normalizedRecipient) {
      setErrorMessage(accountContent.informeONomeDoDestinatario);
      return;
    }

    if (!normalizedPhone) {
      setErrorMessage(accountContent.informeOTelefone);
      return;
    }

    if (normalizedZip.length !== 8) {
      setErrorMessage(accountContent.informeUmCepValidoCom8Numeros);
      return;
    }

    if (!normalizedStreet) {
      setErrorMessage(accountContent.informeARua);
      return;
    }

    if (!normalizedNumber) {
      setErrorMessage(accountContent.informeONumero);
      return;
    }

    if (!normalizedNeighborhood) {
      setErrorMessage(accountContent.informeOBairro);
      return;
    }

    if (!normalizedCity) {
      setErrorMessage(accountContent.informeACidade);
      return;
    }

    if (normalizedState.length !== 2) {
      setErrorMessage(accountContent.informeAUfCom2Letras);
      return;
    }

    try {
      setSaving(true);

      /*
       * Se este endereço for o principal,
       * removemos o principal atual primeiro.
       */
      if (isDefault) {
        const { error: resetDefaultError } = await supabase
          .from("addresses")
          .update({
            is_default: false,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("is_default", true);

        if (resetDefaultError) {
          console.error(
            accountContent.erroAoRemoverEnderecoPrincipalAnterior,
            resetDefaultError,
          );

          setErrorMessage(accountContent.naoFoiPossivelAtualizarOEnderecoPrincipal);

          return;
        }
      }

      const { error: insertError } = await supabase.from("addresses").insert({
        user_id: user.id,
        label: label.trim() || null,

        recipient_name: normalizedRecipient,

        phone: normalizedPhone,

        zip_code: normalizedZip,

        street: normalizedStreet,

        number: normalizedNumber,

        complement: complement.trim() || null,

        neighborhood: normalizedNeighborhood,

        city: normalizedCity,

        state: normalizedState,

        is_default: isDefault,
      });

      if (insertError) {
        console.error(accountContent.erroAoCadastrarEndereco, insertError);

        setErrorMessage(accountContent.naoFoiPossivelCadastrarOEndereco);

        return;
      }

      router.push("/minha-conta");
      router.refresh();
    } catch {
      setErrorMessage(accountContent.naoFoiPossivelSalvarVerifiqueSuaConexaoE);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className={accountStyles.accountFormPage}>
        <p className="text-neutral-500">{accountContent.carregandoSuasInformacoes}</p>
      </section>
    );
  }

  return (
    <section className={accountStyles.accountFormPage}>
      <Link
        href="/minha-conta"
        className="text-sm text-neutral-500 transition hover:text-neutral-950"
      >
        {accountContent.minhaConta}
      </Link>

      <div className="mt-6">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          {accountContent.entrega}
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          {accountContent.adicionarEndereco}
        </h1>

        <p className="mt-2 text-neutral-500">
          {accountContent.cadastreUmEnderecoParaReceberSeusPedidos}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        aria-busy={saving}
        className={[accountStyles.accountForm, "space-y-6"].join(" ")}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="recipientName" className="mb-2 block text-sm font-medium">
              {accountContent.nomeDoDestinatario}
            </label>

            <input
              id="recipientName"
              autoComplete="name"
              type="text"
              required
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
              className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium">
              {accountContent.telefone}
            </label>

            <input
              id="phone"
              autoComplete="tel"
              type="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={"(11) 99999-9999"}
              className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
          <div>
            <label htmlFor="zipCode" className="mb-2 block text-sm font-medium">
              {accountContent.cep}
            </label>

            <input
              id="zipCode"
              autoComplete="postal-code"
              type="text"
              required
              inputMode="numeric"
              value={zipCode}
              onChange={(event) => setZipCode(event.target.value)}
              placeholder={"00000-000"}
              className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>

          <div>
            <label htmlFor="street" className="mb-2 block text-sm font-medium">
              {accountContent.ruaAvenida}
            </label>

            <input
              id="street"
              autoComplete="address-line1"
              type="text"
              required
              value={street}
              onChange={(event) => setStreet(event.target.value)}
              className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
          <div>
            <label htmlFor="number" className="mb-2 block text-sm font-medium">
              {accountContent.numero}
            </label>

            <input
              id="number"
              type="text"
              required
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>

          <div>
            <label htmlFor="complement" className="mb-2 block text-sm font-medium">
              {accountContent.complemento}
            </label>

            <input
              id="complement"
              autoComplete="address-line2"
              type="text"
              value={complement}
              onChange={(event) => setComplement(event.target.value)}
              placeholder={accountContent.apartamentoBloco}
              className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>
        </div>

        <div>
          <label htmlFor="neighborhood" className="mb-2 block text-sm font-medium">
            {accountContent.bairro}
          </label>

          <input
            id="neighborhood"
            type="text"
            required
            value={neighborhood}
            onChange={(event) => setNeighborhood(event.target.value)}
            className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_120px]">
          <div>
            <label htmlFor="city" className="mb-2 block text-sm font-medium">
              {accountContent.cidade}
            </label>

            <input
              id="city"
              autoComplete="address-level2"
              type="text"
              required
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>

          <div>
            <label htmlFor="state" className="mb-2 block text-sm font-medium">
              {accountContent.uf}
            </label>

            <input
              id="state"
              autoComplete="address-level1"
              type="text"
              required
              maxLength={2}
              value={state}
              onChange={(event) => setState(event.target.value)}
              placeholder={accountContent.sp}
              className="w-full border border-neutral-300 px-4 py-3 uppercase outline-none transition focus:border-neutral-950"
            />
          </div>
        </div>

        <div>
          <label htmlFor="label" className="mb-2 block text-sm font-medium">
            {accountContent.nomeDoEndereco}
          </label>

          <input
            id="label"
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={accountContent.casaTrabalho}
            className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
          />
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(event) => setIsDefault(event.target.checked)}
          />
          {accountContent.usarComoEnderecoPrincipal}
        </label>

        {errorMessage && (
          <p role="alert" className={accountStyles.accountNotice}>
            {errorMessage}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? accountContent.salvando : accountContent.salvarEndereco}
          </button>

          <Link
            href="/minha-conta"
            className="border border-neutral-300 px-6 py-3 text-sm font-medium transition hover:border-neutral-950"
          >
            {accountContent.cancelar}
          </Link>
        </div>
      </form>
    </section>
  );
}
