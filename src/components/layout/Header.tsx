"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/src/contexts/CartContext";
import { supabase } from "@/src/lib/supabase/client";

export default function Header() {
  const router = useRouter();
  const { totalItems } = useCart();

  const [userEmail, setUserEmail] =
    useState<string | null>(null);

  const [loadingAuth, setLoadingAuth] =
    useState(true);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserEmail(user?.email ?? null);
      setLoadingAuth(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserEmail(
          session?.user.email ?? null
        );

        setLoadingAuth(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();

    setUserEmail(null);

    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-2xl font-semibold tracking-wide"
        >
          BEECAH
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/perfumes"
            className="text-sm text-neutral-700 transition hover:text-black"
          >
            Perfumes
          </Link>

          <Link
            href="/categorias/feminino"
            className="text-sm text-neutral-700 transition hover:text-black"
          >
            Feminino
          </Link>

          <Link
            href="/categorias/masculino"
            className="text-sm text-neutral-700 transition hover:text-black"
          >
            Masculino
          </Link>

          <Link
            href="/buscar"
            className="text-sm text-neutral-700 transition hover:text-black"
          >
            Buscar
          </Link>
        </nav>

        <div className="flex items-center gap-5">
          {!loadingAuth && (
            <>
              {userEmail ? (
                <>
                  <Link
                    href="/minha-conta"
                    className="text-sm text-neutral-700 transition hover:text-black"
                  >
                    Minha conta
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-sm text-neutral-500 transition hover:text-black"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm text-neutral-700 transition hover:text-black"
                  >
                    Entrar
                  </Link>

                  <Link
                    href="/cadastro"
                    className="text-sm text-neutral-700 transition hover:text-black"
                  >
                    Criar conta
                  </Link>
                </>
              )}
            </>
          )}

          <Link
            href="/favoritos"
            className="text-sm text-neutral-700 transition hover:text-black"
          >
            Favoritos
          </Link>

          <Link
            href="/carrinho"
            className="text-sm text-neutral-700 transition hover:text-black"
          >
            Carrinho
            {totalItems > 0 &&
              ` (${totalItems})`}
          </Link>
        </div>
      </div>
    </header>
  );
}