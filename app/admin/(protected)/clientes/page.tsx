import { adminContent } from "@/src/content/admin";
import { adminStyles } from "@/src/styles/admin";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, Search } from "lucide-react";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";
type Customer = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  confirmed: boolean;
  role: string;
};
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; tipo?: string }>;
}) {
  const auth = await requireAdmin();
  if (!auth.authorized) redirect("/admin/login");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  const type =
    params.tipo === "admin" ? "admin" : params.tipo === "todos" ? "todos" : "clientes";
  const users: Customer[] = [];
  let failed = false;
  for (let page = 1; ; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      failed = true;
      break;
    }
    const ids = data.users.map((u) => u.id);
    if (!ids.length) break;
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id,full_name,role")
      .in("id", ids);
    if (profileError) {
      failed = true;
      break;
    }
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    for (const u of data.users) {
      const p = byId.get(u.id);
      users.push({
        id: u.id,
        name: p?.full_name || adminContent.nomeNaoInformado,
        email: u.email || adminContent.eMailNaoInformado,
        createdAt: u.created_at,
        confirmed: !!u.email_confirmed_at,
        role: p?.role === "admin" ? "admin" : "cliente",
      });
    }
    if (data.users.length < 200) break;
  }
  const filtered = users
    .filter(
      (u) =>
        (type === "todos" ||
          (type === "admin" ? u.role === "admin" : u.role !== "admin")) &&
        (!q ||
          (u.name + " " + u.email)
            .toLocaleLowerCase("pt-BR")
            .includes(q.toLocaleLowerCase("pt-BR"))),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pages = Math.max(1, Math.ceil(filtered.length / 12));
  const requested = Number(params.page);
  const current = Math.min(
    pages,
    Math.max(1, Number.isFinite(requested) ? Math.floor(requested) : 1),
  );
  const visible = failed ? [] : filtered.slice((current - 1) * 12, current * 12);
  const counts = await Promise.all(
    visible.map(async (u) => {
      const { count, error } = await supabaseAdmin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", u.id);
      return { id: u.id, count: error ? null : (count ?? 0) };
    }),
  );
  const countMap = new Map(counts.map((c) => [c.id, c.count]));
  const href = (page: number) =>
    "/admin/clientes?" + new URLSearchParams({ q, tipo: type, page: String(page) });
  return (
    <section className={adminStyles.customersPage}>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[.2em] text-neutral-500">
            {adminContent.relacionamento}
          </p>
          <h1 className="mt-2 text-3xl">{adminContent.clientesEContas}</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {adminContent.consulteCadastrosEEncontreOsPedidosDeCada}
          </p>
        </div>
        <Users size={25} className="text-violet-400" />
      </header>
      <div className={adminStyles.customerMetrics}>
        <article>
          <p>{adminContent.clientesCadastrados}</p>
          <strong>{failed ? "—" : users.filter((u) => u.role !== "admin").length}</strong>
        </article>
        <article>
          <p>{adminContent.eMailsConfirmadosClientes}</p>
          <strong>
            {failed ? "—" : users.filter((u) => u.role !== "admin" && u.confirmed).length}
          </strong>
        </article>
        <article>
          <p>{adminContent.administradores}</p>
          <strong>{failed ? "—" : users.filter((u) => u.role === "admin").length}</strong>
        </article>
      </div>
      <form className={adminStyles.customerFilter} action="/admin/clientes">
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <Search size={17} className="text-neutral-400" />
          <span className="sr-only">{adminContent.buscarPorNomeOuEMail}</span>
          <input
            name="q"
            defaultValue={q}
            placeholder={adminContent.buscarPorNomeOuEMail}
            className="min-w-0 w-full bg-transparent px-2 py-3 text-sm"
          />
        </label>
        <label>
          <span className="sr-only">{adminContent.tipoDeConta}</span>
          <select name="tipo" defaultValue={type} className="px-3 py-3 text-sm">
            <option value="clientes">{adminContent.clientes}</option>
            <option value="admin">{adminContent.administradores}</option>
            <option value="todos">{adminContent.todasAsContas}</option>
          </select>
        </label>
        <button
          className="rounded-full bg-neutral-950 px-5 py-3 text-sm text-white"
          type="submit"
        >
          {adminContent.buscar}
        </button>
        {q && (
          <Link href={"/admin/clientes?tipo=" + type} className="px-2 py-3 text-xs">
            {adminContent.limpar}
          </Link>
        )}
      </form>
      {failed ? (
        <p role="alert" className="mt-5 rounded-xl bg-red-50 p-5 text-sm text-red-700">
          {adminContent.naoFoiPossivelCarregarOsCadastrosAtualizeA}
        </p>
      ) : (
        <>
          <div className="my-5 flex justify-between text-xs text-neutral-500">
            <span>
              {filtered.length}
              {adminContent.contasEncontradas}
            </span>
            <span>
              {adminContent.pagina}
              {current}
              {adminContent.de}
              {pages}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th className="px-4 py-4 text-left">{adminContent.cliente}</th>
                  <th className="px-4 py-4 text-left">{adminContent.cadastro}</th>
                  <th className="px-4 py-4 text-left">{adminContent.eMail}</th>
                  <th className="px-4 py-4 text-left">{adminContent.pedidos}</th>
                  <th className="px-4 py-4">
                    <span className="sr-only">{adminContent.acoes}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <tr key={u.id} className="border-b border-neutral-100">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className={adminStyles.customerAvatar} aria-hidden="true">
                          {u.name.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="mt-1 text-xs text-neutral-500">{u.email}</p>
                          {u.role === "admin" && (
                            <span className={adminStyles.customerRole}>
                              {adminContent.administrador}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {new Date(u.createdAt).toLocaleDateString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                      })}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={
                          adminStyles.customerStatus + (u.confirmed ? "confirmed" : "")
                        }
                      >
                        {u.confirmed
                          ? adminContent.confirmado
                          : adminContent.naoConfirmado}
                      </span>
                    </td>
                    <td className="px-4 py-4">{countMap.get(u.id) ?? "—"}</td>
                    <td className="px-4 py-4">
                      <Link
                        href={"/admin/pedidos?cliente=" + encodeURIComponent(u.id)}
                        aria-label={adminContent.verPedidosDe + u.name}
                      >
                        {adminContent.verPedidos}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visible.length && (
              <p className="py-14 text-center text-sm text-neutral-500">
                {adminContent.nenhumCadastroEncontradoAjusteABuscaOuO}
              </p>
            )}
          </div>
          <nav
            aria-label={adminContent.paginacaoDosClientes}
            className="mt-5 flex items-center justify-between text-sm"
          >
            {current > 1 ? (
              <Link href={href(current - 1)} className="rounded-full bg-white px-5 py-3">
                {adminContent.anterior}
              </Link>
            ) : (
              <span />
            )}
            {current < pages ? (
              <Link href={href(current + 1)} className="rounded-full bg-white px-5 py-3">
                {adminContent.proxima}
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </>
      )}
    </section>
  );
}
