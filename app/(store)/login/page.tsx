"use client";

import { accountContent } from "@/src/content/account";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/src/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage(accountContent.informeSeuEMail);
      return;
    }

    if (!password) {
      setErrorMessage(accountContent.informeSuaSenha);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(accountContent.eMailOuSenhaInvalidos);
        return;
      }

      if (!data.user) {
        setErrorMessage(accountContent.naoFoiPossivelEntrarNaConta);
        return;
      }

      router.replace("/auth/continue");
      router.refresh();
    } catch {
      setErrorMessage(accountContent.ocorreuUmErroAoEntrarNaConta);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="grid overflow-hidden rounded-[28px] border border-neutral-100 bg-[#f7f7f5] lg:min-h-[680px] lg:grid-cols-[1.05fr_1fr]">
        <div className="relative min-h-56 overflow-hidden sm:min-h-72 lg:min-h-full">
          <Image
            src="/images/banners/bghero2.jpg"
            alt={accountContent.umMomentoBeecahEntreFloresEFragrancias}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-[65%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10 lg:p-12">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/80">
              {accountContent.beecahCollection}
            </p>
            <h2 className="mt-4 text-3xl leading-tight sm:text-4xl lg:text-5xl">
              {accountContent.seuProximo}
              <br />
              <span className="font-haerins">{accountContent.encontro}</span>
            </h2>
            <p className="mt-4 hidden max-w-xs text-sm leading-7 text-white/80 sm:block">
              {accountContent.fragranciasEscolhidasParaFazerParteDosSeusMomentos}
            </p>
          </div>
        </div>
        <div className="flex items-center bg-white px-6 py-10 sm:px-12 lg:px-14 lg:py-14">
          <div className="mx-auto w-full max-w-sm">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-beecah-blue">
              {accountContent.seuEspacoBeecah}
            </p>
            <h1 className="mt-4 text-3xl tracking-tight sm:text-4xl">
              {accountContent.queBomTer}
              <br />
              <span className="font-haerins text-beecah-blue">
                {accountContent.voceDeVolta}
              </span>
            </h1>
            <p className="mt-4 text-sm leading-7 text-neutral-500">
              {accountContent.entreParaAcompanharSeusPedidosSalvarFavoritosE}
            </p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5" aria-busy={loading}>
              <div>
                <label htmlFor="email" className="text-sm font-medium">
                  {accountContent.eMail}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={accountContent.voceEmailCom}
                  disabled={loading}
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby={errorMessage ? "login-error" : undefined}
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3.5 text-base transition focus:border-beecah-blue focus:bg-white disabled:opacity-60"
                />
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-medium">
                  {accountContent.senha}
                </label>
                <div className="relative mt-2">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={accountContent.suaSenha}
                    disabled={loading}
                    aria-invalid={Boolean(errorMessage)}
                    aria-describedby={errorMessage ? "login-error" : undefined}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 py-3.5 pl-4 pr-14 text-base transition focus:border-beecah-blue focus:bg-white disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword
                        ? accountContent.ocultarSenha
                        : accountContent.mostrarSenha
                    }
                    aria-pressed={showPassword}
                    disabled={loading}
                    className="absolute inset-y-1 right-1 flex w-11 items-center justify-center rounded-lg text-neutral-500 hover:text-beecah-black"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>
              {errorMessage && (
                <div
                  id="login-error"
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {errorMessage}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-beecah-black px-5 py-4 text-sm font-medium text-white transition hover:bg-beecah-blue disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <LoaderCircle size={18} className="animate-spin" /> : null}
                {loading ? accountContent.entrando : accountContent.entrarNaMinhaConta}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
            <div className="mt-7 flex items-center gap-3 text-[11px] text-neutral-400">
              <span className="h-px flex-1 bg-neutral-200" />
              {accountContent.suaProximaDescobertaComecaAqui}
              <span className="h-px flex-1 bg-neutral-200" />
            </div>
            <p className="mt-6 text-center text-sm text-neutral-500">
              {accountContent.primeiraVezNaBeecah}
              <Link
                href="/cadastro"
                className="font-medium text-beecah-black underline underline-offset-4"
              >
                {accountContent.criarConta}
              </Link>
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-2">
                <LockKeyhole size={13} />
                {accountContent.acessoASuaConta}
              </span>
              <Link href="/atendimento" className="underline underline-offset-4">
                {accountContent.precisaDeAjuda}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
