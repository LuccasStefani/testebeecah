"use client";

import { useFeedbackState } from "@/src/hooks/use-feedback-state";

import { notify } from "@/src/lib/notifications";
import { notificationContent } from "@/src/content/notifications";

import { adminContent } from "@/src/content/admin";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/src/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useFeedbackState("error");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(adminContent.eMailOuSenhaInvalidos);
        return;
      }

      notify.success(notificationContent.login, undefined, "login");
      router.replace("/auth/continue");
      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(adminContent.naoFoiPossivelFazerLogin);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex min-h-screen bg-[#f5f5f3] items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-neutral-100 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          {adminContent.beecah}
        </p>

        <h1 className="mt-3 text-3xl font-semibold">{adminContent.administracao}</h1>

        <p className="mt-2 text-sm text-neutral-500">
          {adminContent.entreComSuaContaDeAdministrador}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              {adminContent.eMail}
            </label>

            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              {adminContent.senha}
            </label>

            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-neutral-950 px-6 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? adminContent.entrando : adminContent.entrar}
          </button>

          {message && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
