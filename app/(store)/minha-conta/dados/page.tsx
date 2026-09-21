"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/src/lib/supabase/client";
import {
  formatCpf,
  isValidCpf,
  normalizeCpf,
} from "@/src/lib/validation/cpf";

export default function MinhaContaDadosPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          full_name,
          phone,
          cpf
        `)
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(
          "Erro ao carregar perfil:",
          error
        );

        setErrorMessage(
          "Não foi possível carregar seus dados."
        );

        setLoading(false);
        return;
      }

      setFullName(
        data?.full_name ?? ""
      );

      setPhone(
        data?.phone ?? ""
      );

      setCpf(
        formatCpf(data?.cpf ?? "")
      );

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    const normalizedName =
      fullName.trim();

    const normalizedPhone =
      phone.trim();

    const normalizedCpf =
      normalizeCpf(cpf);

    if (!normalizedName) {
      setErrorMessage(
        "Informe seu nome."
      );

      return;
    }

    if (!normalizedPhone) {
      setErrorMessage(
        "Informe seu telefone."
      );

      return;
    }

    if (!normalizedCpf) {
      setErrorMessage(
        "Informe seu CPF."
      );

      return;
    }

    if (!isValidCpf(normalizedCpf)) {
      setErrorMessage(
        "Informe um CPF válido."
      );

      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: normalizedName,
          phone: normalizedPhone,
          cpf: normalizedCpf,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error(
          "Erro ao atualizar perfil:",
          error
        );

        setErrorMessage(
          "Não foi possível salvar seus dados."
        );

        return;
      }

      setCpf(
        formatCpf(normalizedCpf)
      );

      setMessage(
        "Dados atualizados com sucesso."
      );

      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-neutral-500">
          Carregando...
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/minha-conta"
        className="text-sm text-neutral-500 transition hover:text-neutral-950"
      >
        ← Minha conta
      </Link>

      <div className="mt-6">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Minha conta
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Dados pessoais
        </h1>

        <p className="mt-2 text-neutral-500">
          Essas informações serão usadas nos seus
          pedidos e entregas.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-10 space-y-6 border border-neutral-200 p-6"
      >
        <div>
          <label
            htmlFor="fullName"
            className="mb-2 block text-sm font-medium"
          >
            Nome completo
          </label>

          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(event) =>
              setFullName(event.target.value)
            }
            autoComplete="name"
            className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
          />
        </div>

        <div>
          <label
            htmlFor="cpf"
            className="mb-2 block text-sm font-medium"
          >
            CPF
          </label>

          <input
            id="cpf"
            type="text"
            required
            inputMode="numeric"
            maxLength={14}
            value={cpf}
            onChange={(event) =>
              setCpf(
                formatCpf(event.target.value)
              )
            }
            placeholder="000.000.000-00"
            className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
          />

          <p className="mt-2 text-xs text-neutral-500">
            O CPF será utilizado nos dados do pedido
            e da entrega.
          </p>
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-medium"
          >
            Telefone
          </label>

          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value)
            }
            placeholder="(11) 99999-9999"
            autoComplete="tel"
            className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
          />

          <p className="mt-2 text-xs text-neutral-500">
            Informe um número com DDD.
          </p>
        </div>

        {errorMessage && (
          <p className="text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        {message && (
          <p className="text-sm text-green-700">
            {message}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Salvando..."
              : "Salvar dados"}
          </button>

          <Link
            href="/minha-conta"
            className="border border-neutral-300 px-6 py-3 text-sm font-medium transition hover:border-neutral-950"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}