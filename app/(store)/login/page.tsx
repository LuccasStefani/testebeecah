"use client";

import { useFeedbackState } from "@/src/hooks/use-feedback-state";

import { notify } from "@/src/lib/notifications";
import { notificationContent } from "@/src/content/notifications";

import { useVisibleVideo } from "@/src/hooks/use-visible-video";
import AuthVideoCaption from "@/src/components/layout/AuthVideoCaption";
import { authVisualContent } from "@/src/content/auth-visual";

import { accountContent } from "@/src/content/account";
import Link from "next/link";
import { getLoginReturnPath } from "@/src/lib/login-return";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Pause,
  Play,
} from "lucide-react";
import { FormEvent, useState, useRef } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/src/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  useVisibleVideo(videoRef, "/video/videologin.mp4", 768);
  async function toggleVideo() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (!video.getAttribute("src")) video.src = "/video/videologin.mp4";
      try {
        await video.play();
      } catch {
        setVideoFailed(true);
      }
    } else video.pause();
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useFeedbackState("error");

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

      notify.success(notificationContent.login, undefined, "login");
      router.replace(
        getLoginReturnPath(new URLSearchParams(window.location.search).get("next")),
      );
      router.refresh();
    } catch {
      setErrorMessage(accountContent.ocorreuUmErroAoEntrarNaConta);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-3 sm:px-6 md:flex md:min-h-[calc(100svh-96px)] md:items-center">
      <div className="grid w-full overflow-hidden rounded-3xl border border-neutral-100 bg-[#f7f7f5] md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden bg-neutral-900 md:block">
          {!videoFailed && (
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload="none"
              poster="/images/banners/bghero2.jpg"
              aria-label={authVisualContent.videoLabel}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onError={() => {
                setVideoFailed(true);
                setPlaying(false);
              }}
              className="absolute inset-0 h-full w-full object-cover"
            ></video>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/10" />
          {!videoFailed && (
            <button
              type="button"
              onClick={toggleVideo}
              aria-label={
                playing ? accountContent.pausarVideo : accountContent.reproduzirVideo
              }
              className="absolute right-5 top-5 flex size-11 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white backdrop-blur-sm hover:bg-black/50"
            >
              {playing ? <Pause size={17} /> : <Play size={17} />}
            </button>
          )}
          <AuthVideoCaption />
        </div>
        <div className="flex items-center bg-white px-5 py-6 sm:px-8 md:py-5 lg:px-10">
          <div className="mx-auto w-full max-w-sm">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-beecah-blue">
              {accountContent.seuEspacoBeecah}
            </p>
            <h1 className="mt-2 text-3xl tracking-tight">
              {accountContent.queBomTer}
              <br />
              <span className="font-haerins text-beecah-blue">
                {accountContent.voceDeVolta}
              </span>
            </h1>
            <p className="mt-2 text-sm leading-5 text-neutral-500">
              {accountContent.entreParaAcompanharSeusPedidosSalvarFavoritosE}
            </p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-3" aria-busy={loading}>
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
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-2.5 text-base transition focus:border-beecah-blue focus:bg-white disabled:opacity-60"
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
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 py-2.5 pl-4 pr-14 text-base transition focus:border-beecah-blue focus:bg-white disabled:opacity-60"
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
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-beecah-black px-5 py-3 text-sm font-medium text-white transition hover:bg-beecah-blue disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <LoaderCircle size={18} className="animate-spin" /> : null}
                {loading ? accountContent.entrando : accountContent.entrarNaMinhaConta}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
            <div className="mt-4 flex items-center gap-3 text-[11px] text-neutral-400">
              <span className="h-px flex-1 bg-neutral-200" />
              {accountContent.suaProximaDescobertaComecaAqui}
              <span className="h-px flex-1 bg-neutral-200" />
            </div>
            <p className="mt-3 text-center text-sm text-neutral-500">
              {accountContent.primeiraVezNaBeecah}
              <Link
                href="/cadastro"
                className="font-medium text-beecah-black underline underline-offset-4"
              >
                {accountContent.criarConta}
              </Link>
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
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
