"use client";

import { accountContent } from "@/src/content/account";
import { accountStyles } from "@/src/styles/account";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  LogOut,
  LayoutGrid,
  Package,
  UserRound,
  MapPin,
  Heart,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";
export default function AccountNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/");
      router.refresh();
    } catch {
      setError(accountContent.naoFoiPossivelSairTenteNovamente);
    } finally {
      setBusy(false);
    }
  }
  const links = [
    {
      href: "/minha-conta",
      label: accountContent.visaoGeral,
      icon: LayoutGrid,
      active: pathname === "/minha-conta",
    },
    {
      href: "/minha-conta#pedidos",
      label: accountContent.meusPedidos,
      icon: Package,
      active: pathname.includes("/pedidos/"),
    },
    {
      href: "/minha-conta/dados",
      label: accountContent.dadosPessoais,
      icon: UserRound,
      active: pathname.includes("/dados"),
    },
    {
      href: "/minha-conta#enderecos",
      label: accountContent.enderecos,
      icon: MapPin,
      active: pathname.includes("/enderecos/"),
    },
  ];
  return (
    <aside className={accountStyles.accountSidebar}>
      <Link href="/perfumes" className={accountStyles.accountStoreLink}>
        {accountContent.continuarComprando}
        <ArrowUpRight size={16} />
      </Link>
      <p className={accountStyles.accountEyebrow}>{accountContent.minhaBeecah}</p>
      <nav aria-label={accountContent.navegacaoDaConta}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={link.active ? "page" : undefined}
            className={link.active ? "is-active" : ""}
          >
            <link.icon size={18} aria-hidden="true" />
            <span className={accountStyles.accountNavLabel}>{link.label}</span>
            <span aria-hidden="true">{"↗"}</span>
          </Link>
        ))}
        <Link href="/favoritos">
          <Heart size={18} aria-hidden="true" />
          <span className={accountStyles.accountNavLabel}>
            {accountContent.favoritos}
          </span>{" "}
          <span aria-hidden="true">{"↗"}</span>
        </Link>
      </nav>
      <button
        type="button"
        disabled={busy}
        onClick={logout}
        className={accountStyles.accountLogout}
      >
        <LogOut size={16} />
        {busy ? accountContent.saindo : accountContent.sairDaConta}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </aside>
  );
}
