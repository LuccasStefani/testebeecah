import { redirect } from "next/navigation";

import { requireAdmin } from "@/src/lib/auth/require-admin";

export default async function AdminPage() {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    redirect("/admin/login");
  }

  const { user } = auth;

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
        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">
            Produtos
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Cadastre e edite perfumes.
          </p>
        </div>

        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">
            Estoque
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Acompanhe quantidades disponíveis.
          </p>
        </div>

        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">
            Pedidos
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Área preparada para os pedidos futuros.
          </p>
        </div>
      </div>
    </section>
  );
}