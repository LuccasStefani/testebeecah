import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export default async function MinhaContaPage() {
  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Minha conta
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Olá, seja bem-vindo
        </h1>

        <p className="mt-2 text-neutral-500">
          {user.email}
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/favoritos"
          className="border border-neutral-200 p-6 transition hover:border-neutral-950"
        >
          <h2 className="font-semibold">
            Favoritos
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Veja os perfumes que você salvou.
          </p>
        </Link>

        <Link
          href="/carrinho"
          className="border border-neutral-200 p-6 transition hover:border-neutral-950"
        >
          <h2 className="font-semibold">
            Carrinho
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Confira os produtos adicionados.
          </p>
        </Link>

        <div className="border border-neutral-200 p-6">
          <h2 className="font-semibold">
            Pedidos
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Seus pedidos aparecerão aqui em breve.
          </p>
        </div>

        <div className="border border-neutral-200 p-6">
          <h2 className="font-semibold">
            Dados da conta
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            E-mail: {user.email}
          </p>
        </div>
      </div>
    </section>
  );
}