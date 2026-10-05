import { adminControls } from "@/src/styles/admin-controls";
import { productTypeLabel } from "@/src/content/product-types";
import { adminContent } from "@/src/content/admin";
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

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select(
      "\n        id,\n        name,\n        slug,\n        brand,\n        price,\n        promo_price,\n        stock,\n        category,\n        product_type,\n        active,\n        created_at\n      ",
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(adminContent.erroAoCarregarProdutos, error);
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <Link
            href="/admin"
            className="text-sm text-neutral-500 transition hover:text-neutral-950"
          >
            {adminContent.painel}
          </Link>

          <h1 className="mt-4 text-3xl font-semibold">{adminContent.produtos}</h1>

          <p className="mt-2 text-neutral-500">
            {adminContent.gerencieOsPerfumesCadastradosNaBeecah}
          </p>
        </div>

        <Link href="/admin/produtos/novo" className={adminControls.primary}>
          {adminContent.novoProduto2}
        </Link>
      </div>

      <div className="mt-10 overflow-x-auto border border-neutral-200">
        <table className="w-full min-w-[900px] text-left">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-5 py-4 text-sm font-medium">{adminContent.produto}</th>

              <th className="px-5 py-4 text-sm font-medium">{adminContent.categoria}</th>

              <th className="px-5 py-4 text-sm font-medium">{adminContent.preco}</th>

              <th className="px-5 py-4 text-sm font-medium">{adminContent.estoque}</th>

              <th className="px-5 py-4 text-sm font-medium">{adminContent.status}</th>

              <th className="px-5 py-4 text-sm font-medium">{adminContent.acoes}</th>
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
                    <p className="font-medium">{product.name}</p>

                    <p className="mt-1 text-sm text-neutral-500">{product.brand}</p>
                  </td>

                  <td className="px-5 py-4 text-sm">
                    <p>{productTypeLabel(product.product_type)}</p>
                    <p className="mt-1 text-xs text-neutral-500">{product.category}</p>
                  </td>

                  <td className="px-5 py-4">
                    {product.promo_price !== null && (
                      <p className="text-xs text-neutral-400 line-through">
                        {formatPrice(Number(product.price))}
                      </p>
                    )}

                    <p className="font-medium">{formatPrice(finalPrice)}</p>
                  </td>

                  <td className="px-5 py-4">
                    <span className={product.stock <= 0 ? "text-red-600" : ""}>
                      {product.stock}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {product.active ? (
                      <span className="text-sm font-medium text-green-700">
                        {adminContent.ativo}
                      </span>
                    ) : (
                      <span className="text-sm text-neutral-400">
                        {adminContent.inativo}
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
                        {adminContent.ver}
                      </Link>

                      <Link
                        href={`/admin/produtos/${product.id}/editar`}
                        className="text-sm underline"
                      >
                        {adminContent.editar}
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}

            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-neutral-500">
                  {adminContent.nenhumProdutoCadastrado}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
