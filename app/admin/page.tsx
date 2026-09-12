import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

export default async function AdminPage() {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    redirect("/admin/login");
  }

  const { user } = auth;

  const [
    { count: productsCount },
    { count: pendingOrdersCount },
    { count: approvedOrdersCount },
  ] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select("*", {
        count: "exact",
        head: true,
      }),

    supabaseAdmin
      .from("orders")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "pending"),

    supabaseAdmin
      .from("orders")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "approved"),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
        Beecah
      </p>

      <h1 className="mt-3 text-3xl font-semibold">
        Painel administrativo
      </h1>

      <p className="mt-2 text-neutral-500">
        Área de gerenciamento da loja.
      </p>

      <p className="mt-4 text-sm text-neutral-400">
        Logado como: {user.email}
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/produtos"
          className="border border-neutral-200 p-6 transition hover:border-neutral-950"
        >
          <p className="text-sm text-neutral-500">
            Produtos
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {productsCount ?? 0}
          </p>

          <p className="mt-3 text-sm text-neutral-500">
            Cadastre, edite e gerencie os perfumes.
          </p>
        </Link>

        <Link
          href="/admin/produtos"
          className="border border-neutral-200 p-6 transition hover:border-neutral-950"
        >
          <p className="text-sm text-neutral-500">
            Estoque
          </p>

          <p className="mt-3 text-lg font-semibold">
            Gerenciar produtos
          </p>

          <p className="mt-3 text-sm text-neutral-500">
            Acompanhe e altere as quantidades disponíveis.
          </p>
        </Link>

        <Link
          href="/admin/pedidos"
          className="border border-neutral-200 p-6 transition hover:border-neutral-950"
        >
          <p className="text-sm text-neutral-500">
            Pedidos
          </p>

          <div className="mt-4 flex gap-6">
            <div>
              <p className="text-2xl font-semibold">
                {pendingOrdersCount ?? 0}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Pendentes
              </p>
            </div>

            <div>
              <p className="text-2xl font-semibold">
                {approvedOrdersCount ?? 0}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Aprovados
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-neutral-500">
            Veja pagamentos e itens comprados.
          </p>
        </Link>
      </div>
    </section>
  );
}