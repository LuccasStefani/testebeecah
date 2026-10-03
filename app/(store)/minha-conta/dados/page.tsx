"use client";

import { useFeedbackState } from "@/src/hooks/use-feedback-state";

import { accountContent } from "@/src/content/account";
import { accountStyles } from "@/src/styles/account";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/src/lib/supabase/client";
import { formatCpf, isValidCpf, normalizeCpf } from "@/src/lib/validation/cpf";

export default function MinhaContaDadosPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useFeedbackState("success");
  const [errorMessage, setErrorMessage] = useFeedbackState("error");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(accountContent.fullNamePhoneCpf)
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(accountContent.erroAoCarregarPerfil, error);

        setErrorMessage(accountContent.naoFoiPossivelCarregarSeusDados);

        setLoading(false);
        return;
      }

      setFullName(data?.full_name ?? "");

      setPhone(data?.phone ?? "");

      setCpf(formatCpf(data?.cpf ?? ""));

      setLoading(false);
    }

    loadProfile().catch(() => {
      setErrorMessage(accountContent.naoFoiPossivelCarregarOsDadosAtualizeA);
      setLoading(false);
    });
  }, [router, setErrorMessage]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    const normalizedName = fullName.trim();

    const normalizedPhone = phone.trim();

    const normalizedCpf = normalizeCpf(cpf);

    if (!normalizedName) {
      setErrorMessage(accountContent.informeSeuNome);

      return;
    }

    if (!normalizedPhone) {
      setErrorMessage(accountContent.informeSeuTelefone);

      return;
    }

    if (!normalizedCpf) {
      setErrorMessage(accountContent.informeSeuCpf);

      return;
    }

    if (!isValidCpf(normalizedCpf)) {
      setErrorMessage(accountContent.informeUmCpfValido);

      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: normalizedName,
          phone: normalizedPhone,
          cpf: normalizedCpf,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error(accountContent.erroAoAtualizarPerfil, error);

        setErrorMessage(accountContent.naoFoiPossivelSalvarSeusDados);

        return;
      }

      setCpf(formatCpf(normalizedCpf));

      setMessage(accountContent.dadosAtualizadosComSucesso);

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
          {accountContent.minhaConta2}
        </p>

        <h1 className="mt-3 text-3xl font-semibold">{accountContent.dadosPessoais}</h1>

        <p className="mt-2 text-neutral-500">
          {accountContent.essasInformacoesSeraoUsadasNosSeusPedidosE}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        aria-busy={saving}
        className={[accountStyles.accountForm, "space-y-6"].join(" ")}
      >
        <div>
          <label htmlFor="fullName" className="mb-2 block text-sm font-medium">
            {accountContent.nomeCompleto}
          </label>

          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
            className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
          />
        </div>

        <div>
          <label htmlFor="cpf" className="mb-2 block text-sm font-medium">
            {accountContent.cpf}
          </label>

          <input
            id="cpf"
            type="text"
            required
            inputMode="numeric"
            maxLength={14}
            value={cpf}
            onChange={(event) => setCpf(formatCpf(event.target.value))}
            placeholder={"000.000.000-00"}
            className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
          />

          <p className="mt-2 text-xs text-neutral-500">
            {accountContent.oCpfSeraUtilizadoNosDadosDoPedido}
          </p>
        </div>

        <div>
          <label htmlFor="phone" className="mb-2 block text-sm font-medium">
            {accountContent.telefone}
          </label>

          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder={"(11) 99999-9999"}
            autoComplete="tel"
            className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
          />

          <p className="mt-2 text-xs text-neutral-500">
            {accountContent.informeUmNumeroComDdd}
          </p>
        </div>

        {errorMessage && (
          <p role="alert" className={accountStyles.accountNotice}>
            {errorMessage}
          </p>
        )}

        {message && (
          <p role="status" className={accountStyles.accountSuccess}>
            {message}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? accountContent.salvando : accountContent.salvarDados}
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
