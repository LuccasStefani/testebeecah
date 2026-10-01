import { adminContent } from "@/src/content/admin";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

function getStockStatus(stock: number) {
  if (stock <= 0) {
    return {
      label: adminContent.esgotado,
      className: "text-red-600",
    };
  }

  if (stock <= 5) {
    return {
      label: adminContent.estoqueBaixo,
      className: "text-amber-600",
    };
  }

  return {
    label: adminContent.emEstoque,
    className: "text-green-700",
  };
}

export default async function AdminStockPage() {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    redirect("/admin/login");
  }

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("\n      id,\n      name,\n      brand,\n      stock,\n      active\n    ")
    .order("stock", {
      ascending: true,
    });

  if (error) {
    console.error(adminContent.erroAoCarregarEstoque, error);
  }

  const productList = products ?? [];

  const totalProducts = productList.length;

  const outOfStock = productList.filter((product) => product.stock <= 0).length;

  const lowStock = productList.filter(
    (product) => product.stock > 0 && product.stock <= 5,
  ).length;

  const totalUnits = productList.reduce(
    (total, product) => total + Number(product.stock),
    0,
  );

  return (
    <section>
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          {adminContent.gestao}
        </p>

        <h1 className="mt-3 text-3xl font-semibold">{adminContent.estoque}</h1>

        <p className="mt-2 text-neutral-500">
          {adminContent.acompanheADisponibilidadeDosProdutosDaBeecah}
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">{adminContent.produtos}</p>

          <p className="mt-2 text-3xl font-semibold">{totalProducts}</p>
        </div>

        <div className="border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">{adminContent.unidadesEmEstoque}</p>

          <p className="mt-2 text-3xl font-semibold">{totalUnits}</p>
        </div>

        <div className="border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">{adminContent.estoqueBaixo}</p>

          <p className="mt-2 text-3xl font-semibold text-amber-600">{lowStock}</p>
        </div>

        <div className="border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">{adminContent.esgotados}</p>

          <p className="mt-2 text-3xl font-semibold text-red-600">{outOfStock}</p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto border border-neutral-200 bg-white">
        <table className="w-full min-w-[750px] text-left">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-5 py-4 text-sm font-medium">{adminContent.produto}</th>

              <th className="px-5 py-4 text-sm font-medium">{adminContent.marca}</th>

              <th className="px-5 py-4 text-sm font-medium">{adminContent.quantidade}</th>

              <th className="px-5 py-4 text-sm font-medium">{adminContent.estoque}</th>

              <th className="px-5 py-4 text-sm font-medium">{adminContent.status}</th>

              <th className="px-5 py-4 text-sm font-medium">{adminContent.acao}</th>
            </tr>
          </thead>

          <tbody>
            {productList.map((product) => {
              const stockStatus = getStockStatus(Number(product.stock));

              return (
                <tr
                  key={product.id}
                  className="border-b border-neutral-200 last:border-b-0"
                >
                  <td className="px-5 py-4 font-medium">{product.name}</td>

                  <td className="px-5 py-4 text-sm text-neutral-500">{product.brand}</td>

                  <td className="px-5 py-4 font-semibold">{product.stock}</td>

                  <td className="px-5 py-4">
                    <span className={`text-sm font-medium ${stockStatus.className}`}>
                      {stockStatus.label}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm">
                    {product.active ? adminContent.ativo : adminContent.inativo}
                  </td>

                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/produtos/${product.id}/editar`}
                      className="text-sm font-medium underline underline-offset-4"
                    >
                      {adminContent.editarEstoque}
                    </Link>
                  </td>
                </tr>
              );
            })}

            {productList.length === 0 && (
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
