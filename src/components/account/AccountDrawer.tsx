"use client";

import { notify } from "@/src/lib/notifications";
import { notificationContent } from "@/src/content/notifications";

import { accountContent } from "@/src/content/account";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  Heart,
  LoaderCircle,
  LogOut,
  Mail,
  Package,
  Phone,
  User,
  X,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";

type Props = { open: boolean; onClose: () => void; userEmail: string | null };
type Profile = { name: string; email: string; phone: string };

export default function AccountDrawer({ open, onClose, userEmail }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      id="account-drawer"
      aria-labelledby="account-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-transparent p-0 text-beecah-black backdrop:bg-black/15 backdrop:backdrop-blur-[6px]"
    >
      {open && (
        <div className="pointer-events-none absolute inset-0 flex justify-end p-3 sm:p-4 lg:p-5">
          <motion.aside
            initial={{ x: reducedMotion ? 0 : "calc(100% + 40px)", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex h-full w-full max-w-[480px] flex-col overflow-hidden rounded-[26px] bg-[#e7e7e7] shadow-2xl"
          >
            <header className="flex shrink-0 items-center gap-4 p-5 sm:p-6">
              <button
                type="button"
                onClick={onClose}
                aria-label={accountContent.fecharPainelDaConta}
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-beecah-black text-white transition hover:opacity-80"
              >
                <X size={21} />
              </button>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">
                  {accountContent.seuEspacoBeecah}
                </p>
                <h2 id="account-title" className="mt-1 text-xl font-medium">
                  {accountContent.minhaConta2}
                </h2>
              </div>
            </header>
            <AccountContent key={userEmail ?? "guest"} onClose={onClose} />
          </motion.aside>
        </div>
      )}
    </dialog>
  );
}

function AccountContent({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) {
          if (authError && authError.name !== "AuthSessionMissingError")
            setError(accountContent.naoFoiPossivelVerificarSuaContaFecheO);
          return;
        }
        const fallbackName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : "";
        setProfile({ name: fallbackName, email: user.email ?? "", phone: "" });
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select(accountContent.fullNamePhone3)
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (profileError) {
          setError(accountContent.seusDadosDePerfilNaoEstaoDisponiveisAgora);
        } else {
          setProfile({
            name: data?.full_name || fallbackName,
            email: user.email ?? "",
            phone: data?.phone ?? "",
          });
        }
      } catch {
        if (!cancelled)
          setError(accountContent.naoFoiPossivelCarregarSuaContaTenteNovamente);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError("");
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      notify.success(notificationContent.logout, undefined, "logout");
      onClose();
      router.push("/");
      router.refresh();
    } catch {
      setError(accountContent.naoFoiPossivelSairDaContaTenteNovamente);
      notify.error(accountContent.naoFoiPossivelSairDaContaTenteNovamente);
    } finally {
      setSigningOut(false);
    }
  }

  if (loading)
    return (
      <div
        role="status"
        className="flex flex-1 items-center justify-center gap-3 text-sm text-neutral-600"
      >
        <LoaderCircle size={20} className="animate-spin" />
        {accountContent.carregandoSuaConta}
      </div>
    );
  const links = [
    {
      href: "/minha-conta/dados",
      title: accountContent.meusDados,
      description: accountContent.informacoesPessoaisECadastro,
      icon: User,
    },
    {
      href: "/minha-conta",
      title: accountContent.meusPedidos,
      description: accountContent.acompanheSuasCompras,
      icon: Package,
    },
    {
      href: "/favoritos",
      title: accountContent.meusFavoritos,
      description: accountContent.suasProximasFragrancias,
      icon: Heart,
    },
  ];
  const initials =
    profile?.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "B";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-5 sm:px-6 sm:pb-6">
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {profile ? (
        <>
          <section className="rounded-[22px] bg-white p-6">
            <div
              className="flex size-16 items-center justify-center rounded-2xl bg-[#f2f4f8] text-2xl font-medium text-beecah-blue"
              aria-hidden="true"
            >
              {initials}
            </div>
            <p className="mt-5 text-xs text-neutral-500">
              {accountContent.queBomTerVocePorAqui}
            </p>
            <h3 className="mt-1 break-words text-2xl font-medium">
              {profile.name
                ? accountContent.ola2 + profile.name.split(" ")[0] + "."
                : accountContent.bemVindoABeecah}
            </h3>
            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="text-xs text-neutral-500">{accountContent.nome}</dt>
                <dd className="mt-1 break-words">
                  {profile.name || accountContent.completeSeuCadastro}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-xs text-neutral-500">
                  <Mail size={13} />
                  {accountContent.eMail2}
                </dt>
                <dd className="mt-1 break-all">
                  {profile.email || accountContent.naoInformado}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-xs text-neutral-500">
                  <Phone size={13} />
                  {accountContent.telefone2}
                </dt>
                <dd className="mt-1">{profile.phone || accountContent.naoInformado}</dd>
              </div>
            </dl>
          </section>
          <nav
            aria-label={accountContent.opcoesDaConta}
            className="mt-3 overflow-hidden rounded-[22px] bg-white divide-y divide-neutral-100"
          >
            {links.map(({ href, title, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-4 p-5 transition hover:bg-neutral-50"
              >
                <Icon size={20} className="shrink-0 text-beecah-blue" />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="mt-1 block text-xs text-neutral-500">
                    {description}
                  </span>
                </span>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-6">
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-neutral-300 bg-white px-5 py-4 text-sm font-medium transition hover:bg-neutral-100 disabled:opacity-50"
            >
              {signingOut ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <LogOut size={17} />
              )}{" "}
              {signingOut ? accountContent.saindo : accountContent.sairDaConta}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="relative h-48 shrink-0 overflow-hidden rounded-[22px]">
            <Image
              src="/images/banners/bghero2.jpg"
              alt={accountContent.fragranciasEMomentosBeecah}
              fill
              sizes="480px"
              className="object-cover"
            />
          </div>
          <div className="mt-3 rounded-[22px] bg-white p-6 sm:p-8">
            <p className="text-xs uppercase tracking-widest text-beecah-blue">
              {accountContent.umEspacoSoSeu}
            </p>
            <h3 className="mt-4 text-3xl leading-tight">
              {accountContent.suasEscolhas}
              <span className="font-haerins text-beecah-blue">
                {accountContent.seuPerfume}
              </span>
            </h3>
            <p className="mt-4 text-sm leading-7 text-neutral-500">
              {accountContent.entreParaAcompanharSeusPedidosGuardarFavoritosE}
            </p>
            <Link
              href="/login"
              onClick={onClose}
              className="mt-7 flex items-center justify-center gap-3 rounded-xl bg-beecah-black px-5 py-4 text-sm font-medium text-white"
            >
              {accountContent.entrarNaMinhaConta2}
              <ArrowUpRight size={17} />
            </Link>
            <Link
              href="/cadastro"
              onClick={onClose}
              className="mt-3 block rounded-xl border border-neutral-200 px-5 py-4 text-center text-sm font-medium"
            >
              {accountContent.criarUmaConta}
            </Link>
          </div>
          <Link
            href="/atendimento"
            onClick={onClose}
            className="mt-auto pt-6 text-center text-xs text-neutral-600 underline underline-offset-4"
          >
            {accountContent.precisaDeAjudaFaleComABeecah}
          </Link>
        </>
      )}
    </div>
  );
}
