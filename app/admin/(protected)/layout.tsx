import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/src/lib/auth/require-admin";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              Beecah
            </p>

            <p className="mt-1 font-semibold">Painel administrativo</p>
          </div>

          <div className="text-right">
            <p className="text-sm text-neutral-500">{auth.user.email}</p>

            <Link
              href="/"
              className="mt-1 inline-block text-xs text-neutral-400 underline underline-offset-4 transition hover:text-neutral-950"
            >
              Ver loja
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit border border-neutral-200 bg-white p-4">
          <nav className="space-y-1">
            <Link
              href="/admin"
              className="block px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/estoque"
              className="block px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
            >
              Estoque
            </Link>

            <Link
              href="/admin/pedidos"
              className="block px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
            >
              Pedidos
            </Link>

            <Link
              href="/admin/produtos"
              className="block px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
            >
              Estoque
            </Link>
          </nav>
        </aside>

        <div>{children}</div>
      </div>
    </div>
  );
}
