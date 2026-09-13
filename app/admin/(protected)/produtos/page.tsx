import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function AdminProductsPage() {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    redirect("/admin/login");
  }

  const { data: products, error } =
    await supabaseAdmin
      .from("products")
      .select(`
        id,
        name,
        slug,
        brand,
        price,
        promo_price,
        stock,
        category,
        active,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    console.error(
      "Erro ao carregar produtos:",
      error
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <Link
            href="/admin"
            className="text-sm text-neutral-500 transition hover:text-neutral-950"
          >
            ← Painel
          </Link>

          <h1 className="mt-4 text-3xl font-semibold">
            Produtos
          </h1>

          <p className="mt-2 text-neutral-500">
            Gerencie os perfumes cadastrados na
            Beecah.
          </p>
        </div>

        <Link
          href="/admin/produtos/novo"
          className="bg-neutral-950 px-5 py-3 text-sm font-medium text-white"
        >
          + Novo produto
        </Link>
      </div>

      <div className="mt-10 overflow-x-auto border border-neutral-200">
        <table className="w-full min-w-[900px] text-left">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-5 py-4 text-sm font-medium">
                Produto
              </th>

              <th className="px-5 py-4 text-sm font-medium">
                Categoria
              </th>

              <th className="px-5 py-4 text-sm font-medium">
                Preço
              </th>

              <th className="px-5 py-4 text-sm font-medium">
                Estoque
              </th>

              <th className="px-5 py-4 text-sm font-medium">
                Status
              </th>

              <th className="px-5 py-4 text-sm font-medium">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {(products ?? []).map((product) => {
              const finalPrice =
                product.promo_price !== null
                  ? Number(product.promo_price)
                  : Number(product.price);

              return (
                <tr
                  key={product.id}
                  className="border-b border-neutral-200 last:border-b-0"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium">
                      {product.name}
                    </p>

                    <p className="mt-1 text-sm text-neutral-500">
                      {product.brand}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm">
                    {product.category}
                  </td>

                  <td className="px-5 py-4">
                    {product.promo_price !== null && (
                      <p className="text-xs text-neutral-400 line-through">
                        {formatPrice(
                          Number(product.price)
                        )}
                      </p>
                    )}

                    <p className="font-medium">
                      {formatPrice(finalPrice)}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={
                        product.stock <= 0
                          ? "text-red-600"
                          : ""
                      }
                    >
                      {product.stock}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {product.active ? (
                      <span className="text-sm font-medium text-green-700">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-sm text-neutral-400">
                        Inativo
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex gap-4">
                      <Link
                        href={`/perfumes/${product.slug}`}
                        target="_blank"
                        className="text-sm underline"
                      >
                        Ver
                      </Link>

                      <Link
                        href={`/admin/produtos/${product.id}/editar`}
                        className="text-sm underline"
                      >
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}

            {(products ?? []).length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-neutral-500"
                >
                  Nenhum produto cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}