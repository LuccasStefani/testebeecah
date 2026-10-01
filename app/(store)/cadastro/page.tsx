"use client";

import { accountContent } from "@/src/content/account";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  MailCheck,
  Pause,
  Play,
} from "lucide-react";
import { FormEvent, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/src/lib/supabase/client";

export default function CadastroPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    const preference = window.matchMedia(accountContent.prefersReducedMotionReduce);
    if (!preference.matches) void video?.play().catch(() => {});
    const stop = () => {
      if (preference.matches) video?.pause();
    };
    preference.addEventListener("change", stop);
    return () => preference.removeEventListener("change", stop);
  }, []);
  async function toggleVideo() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      try {
        await video.play();
      } catch {
        setVideoFailed(true);
      }
    } else video.pause();
  }

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim()) {
      setErrorMessage(accountContent.informeSeuNome);
      return;
    }

    if (!email.trim()) {
      setErrorMessage(accountContent.informeSeuEMail);
      return;
    }

    if (password.length < 6) {
      setErrorMessage(accountContent.aSenhaPrecisaTerPeloMenos6Caracteres);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(accountContent.asSenhasNaoCoincidem);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (!data.user) {
        setErrorMessage(accountContent.naoFoiPossivelCriarSuaConta);
        return;
      }

      if (data.session) {
        router.push("/minha-conta");
        router.refresh();
        return;
      }

      setSuccessMessage(accountContent.contaCriadaVerifiqueSeuEMailParaConfirmar);

      setPassword("");
      setConfirmPassword("");
    } catch {
      setErrorMessage(accountContent.ocorreuUmErroAoCriarSuaConta);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3.5 text-base transition focus:border-beecah-blue focus:bg-white disabled:opacity-60";
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="grid overflow-hidden rounded-[28px] border border-neutral-100 bg-[#f7f7f5] lg:grid-cols-[1fr_1.05fr]">
        <div
          className="relative min-h-64 overflow-hidden bg-beecah-blue sm:min-h-80 lg:min-h-[780px]"
          style={{
            backgroundImage: "url('/images/banners/bghero2.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {!videoFailed && (
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload="metadata"
              poster="/images/banners/bghero2.jpg"
              aria-label={accountContent.videoDeUmFrascoDePerfumeSobrePedras}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onError={() => {
                setVideoFailed(true);
                setPlaying(false);
              }}
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source
                src="https://videos.pexels.com/video-files/7815962/7815962-hd_1080_1920_25fps.mp4"
                type="video/mp4"
              />
            </video>
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
          <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10 lg:p-12">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/80">
              {accountContent.beecahCollection}
            </p>
            <h2 className="mt-4 text-3xl leading-tight sm:text-4xl lg:text-5xl">
              {accountContent.encontreOSeu}
              <br />
              <span className="font-haerins">{accountContent.proximoPerfume}</span>
            </h2>
            <p className="mt-5 hidden max-w-xs text-sm leading-7 text-white/80 lg:block">
              {accountContent.salveSuasEscolhasEAcompanheCadaNovaDescoberta}
            </p>
          </div>
        </div>
        <div className="flex items-center bg-white px-6 py-9 sm:px-12 lg:px-14 lg:py-12">
          <div className="mx-auto w-full max-w-md">
            {successMessage ? (
              <div role="status" className="py-8">
                <MailCheck size={38} strokeWidth={1.4} className="text-beecah-blue" />
                <p className="mt-7 text-[10px] uppercase tracking-[0.25em] text-beecah-blue">
                  {accountContent.soMaisUmPasso}
                </p>
                <h1 className="mt-4 text-3xl tracking-tight">
                  {accountContent.confiraSeuEMail}
                </h1>
                <p className="mt-5 text-sm leading-7 text-neutral-600">
                  {accountContent.enviamosAsInstrucoesDeConfirmacaoPara}{" "}
                  <strong className="break-all font-medium text-beecah-black">
                    {email}
                  </strong>
                  {accountContent.abraAMensagemParaConcluirSeuCadastro}
                </p>
                <p className="mt-4 text-sm leading-7 text-neutral-500">
                  {accountContent.naoEncontrouVerifiqueTambemAPastaDeSpam}
                </p>
                <Link
                  href="/login"
                  className="mt-8 flex items-center justify-center gap-3 rounded-xl bg-beecah-black px-5 py-4 text-sm text-white hover:bg-beecah-blue"
                >
                  {accountContent.irParaOLogin}
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/atendimento"
                  className="mt-5 block py-3 text-center text-sm text-neutral-600 underline underline-offset-4"
                >
                  {accountContent.precisoDeAjuda}
                </Link>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-beecah-blue">
                  {accountContent.seuEspacoBeecah}
                </p>
                <h1 className="mt-4 text-3xl tracking-tight sm:text-4xl">
                  {accountContent.crieSua}{" "}
                  <span className="font-haerins text-beecah-blue">
                    {accountContent.conta}
                  </span>
                </h1>
                <p className="mt-4 text-sm leading-7 text-neutral-500">
                  {accountContent.guardeSeusFavoritosEAcompanheSeusPedidos}
                </p>
                <form
                  onSubmit={handleSubmit}
                  aria-busy={loading}
                  className="mt-7 space-y-5"
                >
                  <div>
                    <label htmlFor="name" className="text-sm font-medium">
                      {accountContent.nomeCompleto}
                    </label>
                    <input
                      id="name"
                      name="name"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={accountContent.comoPodemosChamarVoce}
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="text-sm font-medium">
                      {accountContent.eMail}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={accountContent.voceEmailCom}
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="password" className="text-sm font-medium">
                        {accountContent.senha}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-pressed={showPassword}
                        aria-label={
                          showPassword
                            ? accountContent.ocultarSenhas
                            : accountContent.mostrarSenhas
                        }
                        className="flex min-h-11 items-center gap-2 px-2 text-xs text-neutral-500 hover:text-beecah-black"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}{" "}
                        {showPassword ? accountContent.ocultar : accountContent.mostrar}
                      </button>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      aria-describedby="password-hint"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={accountContent.crieUmaSenha}
                      disabled={loading}
                      className={inputClass}
                    />
                    <p id="password-hint" className="mt-2 text-xs text-neutral-500">
                      {accountContent.usePeloMenos6Caracteres}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                      {accountContent.confirmarSenha}
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={accountContent.repitaSuaSenha}
                      disabled={loading}
                      aria-invalid={Boolean(
                        confirmPassword && confirmPassword !== password,
                      )}
                      aria-describedby={
                        confirmPassword && confirmPassword !== password
                          ? "password-match"
                          : undefined
                      }
                      className={inputClass}
                    />
                    {confirmPassword && confirmPassword !== password && (
                      <p id="password-match" className="mt-2 text-xs text-red-700">
                        {accountContent.asSenhasPrecisamSerIguais}
                      </p>
                    )}
                  </div>
                  {errorMessage && (
                    <div
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
                    {loading ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      <ArrowRight size={18} />
                    )}{" "}
                    {loading
                      ? accountContent.criandoSuaConta
                      : accountContent.criarMinhaConta}
                  </button>
                </form>
                <p className="mt-7 border-t border-neutral-100 pt-6 text-center text-sm text-neutral-500">
                  {accountContent.jaTemUmaConta}{" "}
                  <Link
                    href="/login"
                    className="font-medium text-beecah-black underline underline-offset-4"
                  >
                    {accountContent.entrar}
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
