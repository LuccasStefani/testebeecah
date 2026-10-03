"use client";

import { storeContent } from "@/src/content/store";
import Link from "next/link";
import { useEffect, useState } from "react";

import { User, ShoppingBag, Heart, Search } from "lucide-react";

import {
  Navbar,
  NavBody,
  MobileNav,
  NavbarLogo,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/src/components/ui/resizable-navbar";

import { PlaceholdersAndVanishInput } from "@/src/components/ui/placeholders-and-vanish-input";

import dynamic from "next/dynamic";
const SearchDrawer = dynamic(() => import("@/src/components/search/SearchDrawer"));
const AccountDrawer = dynamic(() => import("@/src/components/account/AccountDrawer"));

import { useCart } from "@/src/contexts/CartContext";
import { supabase } from "@/src/lib/supabase/client";

export default function Header() {
  const { totalItems } = useCart();

  /* =========================================
     ESTADOS
  ========================================= */

  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [loadingAuth, setLoadingAuth] = useState(true);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [accountLoaded, setAccountLoaded] = useState(false);
  const [searchLoaded, setSearchLoaded] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);

  /* =========================================
     PLACEHOLDERS DA BUSCA
  ========================================= */

  const searchPlaceholders = [
    storeContent.buscarPerfumes,
    storeContent.asadLattafa,
    storeContent.perfumesMasculinos,
    storeContent.perfumesFemininos,
    storeContent.encontreSeuProximoCheiro,
  ];

  /* =========================================
     AUTENTICAÇÃO
  ========================================= */

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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);

      setLoadingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /* =========================================
     LOGOUT
  ========================================= */

  function openAccount() {
    setAccountLoaded(true);
    setIsMobileMenuOpen(false);
    setSearchOpen(false);
    setAccountOpen(true);
  }

  /* =========================================
     MENU MOBILE
  ========================================= */

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen]);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  /* =========================================
     ABRIR BUSCA
  ========================================= */

  function openSearch() {
    setSearchLoaded(true);
    setAccountOpen(false);
    /*
     * Se a busca for aberta pelo menu mobile,
     * fechamos primeiro o menu.
     */

    setIsMobileMenuOpen(false);

    setSearchOpen(true);
  }

  /* =========================================
     FECHAR BUSCA
  ========================================= */

  function closeSearch() {
    setSearchOpen(false);
  }

  return (
    <div className="relative w-full">
      <Navbar>
        {/* =====================================
            DESKTOP
        ====================================== */}

        <NavBody className="relative">
          {/* =================================
              MENU ESQUERDO
          ================================== */}

          <nav className="flex items-center gap-6">
            <Link
              href="/perfumes"
              className="
                text-[15px]
                font-medium
                text-beecah-black
                transition
                hover:opacity-60
              "
            >
              {storeContent.colecao}
            </Link>

            <Link
              href="/categorias/arabes"
              className="
                text-[15px]
                font-medium
                text-beecah-black
                transition
                hover:opacity-60
              "
            >
              {storeContent.arabes}
            </Link>

            <Link
              href="/categorias/feminino"
              className="
                text-[15px]
                font-medium
                text-beecah-black
                transition
                hover:opacity-60
              "
            >
              {storeContent.feminino}
            </Link>

            <Link
              href="/categorias/masculino"
              className="
                text-[15px]
                font-medium
                text-beecah-black
                transition
                hover:opacity-60
              "
            >
              {storeContent.masculino}
            </Link>
          </nav>

          {/* =================================
              LOGO CENTRAL
          ================================== */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-1/2
              z-20
              -translate-x-1/2
              -translate-y-1/2
            "
          >
            <NavbarLogo
              className="
                pointer-events-auto
                scale-[1.25]
              "
            />
          </div>

          {/* =================================
              MENU DIREITO
          ================================== */}

          <div className="flex items-center gap-2">
            {/* ===============================
                CONTA
            ================================ */}

            <button
              type="button"
              onClick={openAccount}
              aria-label={storeContent.abrirMinhaConta}
              aria-haspopup="dialog"
              aria-expanded={accountOpen}
              aria-controls="account-drawer"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-beecah-black text-white transition hover:opacity-80"
            >
              <User size={19} strokeWidth={1.6} />
            </button>

            {/* ===============================
                CARRINHO
            ================================ */}

            <Link
              href="/carrinho"
              aria-label={storeContent.carrinho}
              className="
                relative
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-beecah-black
                text-beecah-white
                transition
                hover:opacity-80
              "
            >
              <ShoppingBag size={18} strokeWidth={1.6} />

              {totalItems > 0 && (
                <span
                  className="
                    absolute
                    -right-1
                    -top-2
                    flex
                    h-6
                    min-w-6
                    items-center
                    justify-center
                    rounded-full
                    bg-beecah-blue
                    px-1
                    text-[10px]
                    font-semibold
                    text-beecah-white
                  "
                >
                  {totalItems}
                </span>
              )}
            </Link>

            {/* ===============================
                FAVORITOS
            ================================ */}

            <Link
              href="/favoritos"
              aria-label={storeContent.favoritos}
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-beecah-black
                text-beecah-white
                transition
                hover:opacity-80
              "
            >
              <Heart size={19} strokeWidth={1.6} />
            </Link>

            {/* ===============================
                BUSCA ANIMADA

                Agora NÃO é mais um campo
                de pesquisa direto.

                O componente funciona como
                gatilho para o SearchDrawer.
            ================================ */}

            <div className="w-[190px]">
              <PlaceholdersAndVanishInput
                placeholders={searchPlaceholders}
                triggerMode
                onTrigger={openSearch}
              />
            </div>
          </div>
        </NavBody>

        {/* =====================================
            MOBILE
        ====================================== */}

        <MobileNav>
          <MobileNavHeader>
            {/* ===============================
                LOGO
            ================================ */}

            <NavbarLogo className="w-13 min-[360px]:w-20 [&_img]:h-auto [&_img]:w-full" />

            {/* ===============================
                AÇÕES
            ================================ */}

            <div className="relative z-10 flex shrink-0 items-center gap-1 [&_svg]:shrink-0">
              <button
                type="button"
                onClick={openAccount}
                aria-label={storeContent.abrirMinhaConta}
                aria-haspopup="dialog"
                aria-expanded={accountOpen}
                aria-controls="account-drawer"
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#171914] text-white"
              >
                <User size={18} strokeWidth={1.6} />
              </button>
              {/* =============================
                  BUSCA MOBILE

                  Agora pode abrir a busca
                  sem precisar abrir o menu.
              ============================== */}

              <button
                type="button"
                onClick={openSearch}
                aria-label={storeContent.buscarPerfumes}
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  shrink-0
                  rounded-xl
                  bg-[#171914]
                  text-white
                  transition
                  hover:opacity-80
                "
              >
                <Search size={18} strokeWidth={1.7} />
              </button>

              {/* =============================
                  CARRINHO
              ============================== */}

              <Link
                href="/carrinho"
                aria-label={storeContent.carrinho}
                className="
                  relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#171914]
                  text-white
                "
              >
                <ShoppingBag size={21} strokeWidth={1.6} />

                {totalItems > 0 && (
                  <span
                    className="
                      absolute
                      -right-2
                      -top-2
                      flex
                      h-4
                      min-w-4
                      items-center
                      justify-center
                      rounded-full
                      bg-beecah-blue
                      px-1
                      text-[9px]
                      text-beecah-white
                    "
                  >
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* =============================
                  BOTÃO MENU
              ============================== */}

              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen((current) => !current)}
              />
            </div>
          </MobileNavHeader>

          {/* =================================
              MENU MOBILE ABERTO
          ================================== */}

          <MobileNavMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu}>
            <Link
              href="/perfumes"
              onClick={closeMobileMenu}
              className="text-beecah-black"
            >
              {storeContent.colecao}
            </Link>

            <Link
              href="/categorias/arabes"
              onClick={closeMobileMenu}
              className="text-beecah-black"
            >
              {storeContent.arabes}
            </Link>

            <Link
              href="/categorias/feminino"
              onClick={closeMobileMenu}
              className="text-beecah-black"
            >
              {storeContent.feminino}
            </Link>

            <Link
              href="/categorias/masculino"
              onClick={closeMobileMenu}
              className="text-beecah-black"
            >
              {storeContent.masculino}
            </Link>

            <Link
              href="/categorias/novos"
              onClick={closeMobileMenu}
              className="text-beecah-black"
            >
              {storeContent.novos}
            </Link>
            <Link
              href="/categorias/mais-vendidos"
              onClick={closeMobileMenu}
              className="text-beecah-black"
            >
              {storeContent.maisVendidos}
            </Link>
            <Link
              href="/favoritos"
              onClick={closeMobileMenu}
              className="text-beecah-black"
            >
              {storeContent.favoritos}
            </Link>

            {/* ===============================
                CONTA / LOGIN
            ================================ */}

            <button
              type="button"
              onClick={openAccount}
              aria-haspopup="dialog"
              className="text-beecah-black"
            >
              {userEmail ? storeContent.minhaConta : storeContent.entrar}
            </button>

            {/* ===============================
                CADASTRO
            ================================ */}

            {!loadingAuth && !userEmail && (
              <Link
                href="/cadastro"
                onClick={closeMobileMenu}
                className="text-beecah-black"
              >
                {storeContent.criarConta}
              </Link>
            )}

            {/* ===============================
                LOGOUT
            ================================ */}

            {/* ===============================
                BUSCA NO MENU MOBILE

                Mantemos também uma opção
                grande dentro do menu.
            ================================ */}

            <button
              type="button"
              onClick={openSearch}
              className="
                mt-2
                flex
                w-full
                items-center
                justify-between
                rounded-xl
                bg-beecah-black
                px-4
                py-3
                text-left
                text-sm
                text-beecah-white
                transition
                hover:opacity-90
              "
            >
              <span>{storeContent.buscarPerfume}</span>

              <Search size={19} strokeWidth={1.7} />
            </button>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* =====================================
          SEARCH DRAWER

          Fica fora do Navbar para não herdar
          transformações/animações do Header.
      ====================================== */}

      {accountLoaded && (
        <AccountDrawer
          open={accountOpen}
          onClose={() => setAccountOpen(false)}
          userEmail={userEmail}
        />
      )}

      {searchLoaded && <SearchDrawer open={searchOpen} onClose={closeSearch} />}
    </div>
  );
}
