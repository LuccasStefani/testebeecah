"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/src/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Informe seu e-mail.");
      return;
    }

    if (!password) {
      setErrorMessage("Informe sua senha.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        setErrorMessage(
          "E-mail ou senha inválidos."
        );
        return;
      }

      if (!data.user) {
        setErrorMessage(
          "Não foi possível entrar na conta."
        );
        return;
      }

      router.push("/minha-conta");
      router.refresh();
    } catch {
      setErrorMessage(
        "Ocorreu um erro ao entrar na conta."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Beecah
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Entrar
          </h1>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Acesse sua conta para acompanhar pedidos,
            favoritos e carrinho.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-neutral-700"
            >
              E-mail
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="voce@email.com"
              disabled={loading}
              className="mt-2 w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950 disabled:bg-neutral-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-neutral-700"
            >
              Senha
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Sua senha"
              disabled={loading}
              className="mt-2 w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950 disabled:bg-neutral-100"
            />
          </div>

          {errorMessage && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-950 px-4 py-3 font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Entrando..."
              : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Ainda não possui conta?{" "}
          <Link
            href="/cadastro"
            className="font-medium text-neutral-950 underline underline-offset-4"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </section>
  );
}