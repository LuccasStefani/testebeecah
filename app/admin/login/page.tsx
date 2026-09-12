"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/src/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        setMessage("E-mail ou senha inválidos.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        "Não foi possível fazer login."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <div className="w-full max-w-md border border-neutral-200 p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Beecah
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Administração
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          Entre com sua conta de administrador.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              E-mail
            </label>

            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Senha
            </label>

            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-950 px-6 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Entrando..."
              : "Entrar"}
          </button>

          {message && (
            <p className="text-sm text-red-600">
              {message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}