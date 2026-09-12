"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/src/lib/supabase/client";

export default function CadastroPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim()) {
      setErrorMessage("Informe seu nome.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Informe seu e-mail.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        "A senha precisa ter pelo menos 6 caracteres."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        "As senhas não coincidem."
      );
      return;
    }

    try {
      setLoading(true);

      const { data, error } =
        await supabase.auth.signUp({
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
        setErrorMessage(
          "Não foi possível criar sua conta."
        );
        return;
      }

      if (data.session) {
        router.push("/minha-conta");
        router.refresh();
        return;
      }

      setSuccessMessage(
        "Conta criada. Verifique seu e-mail para confirmar o cadastro."
      );

      setPassword("");
      setConfirmPassword("");
    } catch {
      setErrorMessage(
        "Ocorreu um erro ao criar sua conta."
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
            Criar conta
          </h1>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Cadastre-se para acompanhar seus pedidos,
            favoritos e carrinho.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="name"
              className="text-sm font-medium text-neutral-700"
            >
              Nome
            </label>

            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Seu nome"
              disabled={loading}
              className="mt-2 w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950 disabled:bg-neutral-100"
            />
          </div>

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
              autoComplete="new-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Mínimo de 6 caracteres"
              disabled={loading}
              className="mt-2 w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950 disabled:bg-neutral-100"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-neutral-700"
            >
              Confirmar senha
            </label>

            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Digite a senha novamente"
              disabled={loading}
              className="mt-2 w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950 disabled:bg-neutral-100"
            />
          </div>

          {errorMessage && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-950 px-4 py-3 font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Criando conta..."
              : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Já possui uma conta?{" "}
          <Link
            href="/login"
            className="font-medium text-neutral-950 underline underline-offset-4"
          >
            Entrar
          </Link>
        </p>
      </div>
    </section>
  );
}