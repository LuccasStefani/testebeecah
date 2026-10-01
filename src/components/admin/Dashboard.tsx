"use client";

import { adminContent } from "@/src/content/admin";
import { adminStyles } from "@/src/styles/admin";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  ArrowUpRight,
  TrendingUp,
  Package,
  Heart,
  MousePointer2,
} from "lucide-react";

export type ProductMetric = { id: string; name: string; stock: number; active: boolean };
export type OrderMetric = {
  id: string;
  status: string;
  total: number;
  created_at: string;
};
export type SaleMetric = {
  product_id: string | null;
  product_name: string;
  quantity: number;
  subtotal: number;
  orders: { created_at: string; status: string };
};
export type DashboardData = {
  products: ProductMetric[];
  orders: OrderMetric[];
  sales: SaleMetric[];
  favorites: { product_id: string }[];
  clicks: { product_id: string; created_at: string }[];
  errors: string[];
  updatedAt: string;
};
const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const tabs = [adminContent.desempenho, adminContent.produtos, adminContent.operacao];
export default function Dashboard({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [days, setDays] = useState(30);
  const [ranking, setRanking] = useState("sales");
  const [search, setSearch] = useState("");
  const since = new Date(data.updatedAt).getTime() - days * 86400000;
  const orders = data.orders.filter((o) => new Date(o.created_at).getTime() >= since);
  const paid = orders.filter((o) => o.status === "approved");
  const revenue = paid.reduce((sum, o) => sum + Number(o.total), 0);
  const sales = data.sales.filter(
    (s) => new Date(s.orders.created_at).getTime() >= since,
  );
  const units = sales.reduce((sum, s) => sum + Number(s.quantity), 0);
  const sold = new Map<
    string,
    { id: string; name: string; count: number; amount: number }
  >();
  sales.forEach((s) => {
    const id = s.product_id || s.product_name;
    const row = sold.get(id) || {
      id: s.product_id || "",
      name: s.product_name,
      count: 0,
      amount: 0,
    };
    row.count += Number(s.quantity);
    row.amount += Number(s.subtotal);
    sold.set(id, row);
  });
  const fav = new Map<string, number>();
  data.favorites.forEach((f) => fav.set(f.product_id, (fav.get(f.product_id) || 0) + 1));
  const favorites = data.products
    .map((p) => ({ id: p.id, name: p.name, count: fav.get(p.id) || 0, amount: 0 }))
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count);
  const best = [...sold.values()].sort((a, b) => b.count - a.count);
  const low = data.products
    .filter((p) => p.active && p.stock <= 5)
    .sort((a, b) => a.stock - b.stock);
  const unavailable = (source: string) => data.errors.includes(source);
  const metrics = [
    {
      label: adminContent.valorDosPedidosAprovados,
      value: unavailable("orders") ? "—" : money(revenue),
      hint: adminContent.incluiFreteRegistradoNoPedido,
    },
    {
      label: adminContent.pedidosAprovados,
      value: unavailable("orders") ? "—" : String(paid.length),
      hint: orders.length + adminContent.pedidosNoPeriodo,
    },
    {
      label: adminContent.ticketMedio,
      value: unavailable("orders") ? "—" : money(paid.length ? revenue / paid.length : 0),
      hint: adminContent.valorAprovadoPedidosAprovados,
    },
    {
      label: adminContent.unidadesVendidas,
      value: unavailable("sales") ? "—" : String(units),
      hint: adminContent.somentePagamentosAprovados,
    },
  ];
  const bins = Array.from({ length: 7 }, (_, i) => {
    const start = since + (i * days * 86400000) / 7;
    const end = since + ((i + 1) * days * 86400000) / 7;
    return {
      label: new Date(start).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "America/Sao_Paulo",
      }),
      value: paid
        .filter((o) => {
          const date = new Date(o.created_at).getTime();
          return date >= start && date < end;
        })
        .reduce((sum, o) => sum + Number(o.total), 0),
    };
  });
  const max = Math.max(...bins.map((b) => b.value), 1);
  const clickCounts = new Map<string, number>();
  data.clicks
    .filter((c) => new Date(c.created_at).getTime() >= since)
    .forEach((c) =>
      clickCounts.set(c.product_id, (clickCounts.get(c.product_id) || 0) + 1),
    );
  const clicked = data.products
    .map((p) => ({
      id: p.id,
      name: p.name,
      count: clickCounts.get(p.id) || 0,
      amount: 0,
    }))
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count);
  const rows = (
    ranking === "clicks" ? clicked : ranking === "favorites" ? favorites : best
  ).filter((p) =>
    p.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")),
  );
  function rankList(list: typeof best, unit: string) {
    return list.length ? (
      <ol
        className={
          tab === 1
            ? [adminStyles.dashRanking, "dash-product-grid"].join(" ")
            : adminStyles.dashRanking
        }
      >
        {list.slice(0, tab === 1 ? 6 : 5).map((p, i) => (
          <li key={p.id || p.name}>
            <span className={adminStyles.dashPosition}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className={adminStyles.dashProduct}>
              {p.id ? (
                <Link href={"/admin/produtos/" + p.id + "/editar"}>{p.name}</Link>
              ) : (
                p.name
              )}
              <span className={adminStyles.dashTrack}>
                <span
                  style={{ width: (p.count / Math.max(list[0].count, 1)) * 100 + "%" }}
                />
              </span>
            </span>
            <strong>
              {p.count}
              <small>{unit}</small>
            </strong>
          </li>
        ))}
      </ol>
    ) : (
      <div className={adminStyles.dashEmpty}>
        {search
          ? adminContent.nenhumPerfumeEncontradoTenteOutroNome
          : adminContent.aindaNaoHaDadosParaEsteRanking}
      </div>
    );
  }
  return (
    <section className={[adminStyles.adminDashboard, "ranking-"].join(" ") + ranking}>
      <header className={adminStyles.dashHeader}>
        <div>
          <p className={adminStyles.dashKicker}>
            {adminContent.beecahInteligenciaDaLoja}
          </p>
          <h1>{adminContent.dashboard}</h1>
        </div>
        <div className={adminStyles.dashTools}>
          <label className="sr-only" htmlFor="dash-period">
            {adminContent.periodoDasVendas}
          </label>
          <select
            id="dash-period"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>{adminContent.ultimos7Dias}</option>
            <option value={30}>{adminContent.ultimos30Dias}</option>
            <option value={90}>{adminContent.ultimos90Dias}</option>
          </select>
          <button
            onClick={() => router.refresh()}
            aria-label={adminContent.atualizarIndicadores}
          >
            <RefreshCw size={17} />
          </button>
          <Link href="/admin/produtos/novo">{adminContent.produto2}</Link>
        </div>
      </header>
      <div
        className={adminStyles.dashTabs}
        role="tablist"
        aria-label={adminContent.secoesDoDashboard}
      >
        {tabs.map((name, i) => (
          <button
            key={name}
            id={"dash-tab-" + i}
            role="tab"
            aria-selected={tab === i}
            aria-controls={"dash-panel-" + i}
            tabIndex={tab === i ? 0 : -1}
            onClick={() => setTab(i)}
            onKeyDown={(e) => {
              if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const next =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? 2
                      : (i + (e.key === "ArrowRight" ? 1 : 2)) % 3;
                setTab(next);
                document.getElementById("dash-tab-" + next)?.focus();
              }
            }}
          >
            {name}
          </button>
        ))}
        <span>
          {adminContent.atualizado}
          {new Date(data.updatedAt).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Sao_Paulo",
          })}
        </span>
      </div>
      {!!data.errors.length && (
        <p role="alert" className={adminStyles.dashWarning}>
          {adminContent.algunsDadosNaoCarregaramAtualizeParaTentarNovamente}
          {data.errors
            .map(
              (e) =>
                ({
                  products: "produtos",
                  orders: "pedidos",
                  sales: "vendas",
                  favorites: "favoritos",
                  clicks: "cliques",
                })[e],
            )
            .join(", ")}
          {"."}
        </p>
      )}
      <div
        role="tabpanel"
        id={"dash-panel-" + tab}
        aria-labelledby={"dash-tab-" + tab}
        className={"dash-panel dash-panel-" + tab}
      >
        {tab === 0 && (
          <>
            <div className={adminStyles.dashMetrics}>
              {metrics.map((m) => (
                <article key={m.label}>
                  <p>{m.label}</p>
                  <strong>{m.value}</strong>
                  <small>{m.hint}</small>
                </article>
              ))}
            </div>
            <div className={adminStyles.dashGrid}>
              <article className={adminStyles.dashCard}>
                <div className={adminStyles.dashCardTitle}>
                  <div>
                    <h2>{adminContent.evolucaoDasVendas}</h2>
                    <p>
                      {adminContent.pedidosAprovadosPorDataDeCriacao}
                      {days}
                      {adminContent.dias}
                    </p>
                  </div>
                  <TrendingUp size={19} />
                </div>
                {unavailable("orders") ? (
                  <div className={adminStyles.dashEmpty}>
                    {adminContent.vendasIndisponiveis}
                  </div>
                ) : (
                  <div
                    className={adminStyles.dashChart}
                    aria-label={adminContent.valoresAprovadosPorIntervalo}
                  >
                    {bins.map((b, i) => (
                      <div key={i} className={adminStyles.dashBarColumn}>
                        <span>{money(b.value)}</span>
                        <div className={adminStyles.dashBarSpace}>
                          <div
                            style={{
                              height:
                                Math.max((b.value / max) * 100, b.value ? 2 : 0) + "%",
                            }}
                          />
                        </div>
                        <small>{b.label}</small>
                      </div>
                    ))}
                  </div>
                )}
                <p className={adminStyles.dashFootnote}>
                  {adminContent.cadaBarraAgrupaAproximadamente}
                  {Math.round(days / 7)}
                  {adminContent.diasValoresAtuaisSemPrevisao}
                </p>
              </article>
              <article className={adminStyles.dashCard}>
                <div className={adminStyles.dashCardTitle}>
                  <div>
                    <h2>{adminContent.maisVendidos}</h2>
                    <p>{adminContent.top5UnidadesNoPeriodo}</p>
                  </div>
                  <Package size={19} />
                </div>
                {unavailable("sales") ? (
                  <div className={adminStyles.dashEmpty}>
                    {adminContent.rankingIndisponivel}
                  </div>
                ) : (
                  rankList(best, "un.")
                )}
              </article>
            </div>
          </>
        )}
        {tab === 1 && (
          <>
            <div className={adminStyles.dashRankingTabs}>
              <label className={adminStyles.dashSearch}>
                <span className="sr-only">{adminContent.buscarPerfumeNoRanking}</span>
                <input
                  type="search"
                  placeholder={adminContent.buscarPerfume}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <button
                aria-pressed={ranking === "sales"}
                onClick={() => setRanking("sales")}
              >
                <TrendingUp size={16} />
                {adminContent.maisVendidos2}
              </button>
              <button
                aria-pressed={ranking === "favorites"}
                onClick={() => setRanking("favorites")}
              >
                <Heart size={16} />
                {adminContent.maisFavoritados}
              </button>
              <button
                aria-pressed={ranking === "clicks"}
                onClick={() => setRanking("clicks")}
              >
                <MousePointer2 size={16} />
                {adminContent.maisClicados}
              </button>
            </div>
            <div className={adminStyles.dashGrid}>
              <article className={adminStyles.dashCard}>
                <div className={adminStyles.dashCardTitle}>
                  <div>
                    <h2>
                      {ranking === "favorites"
                        ? adminContent.osFavoritosDosClientes
                        : ranking === "clicks"
                          ? adminContent.interesseNosPerfumes
                          : adminContent.perfumesMaisVendidos}
                    </h2>
                    <p>
                      {ranking === "favorites"
                        ? adminContent.favoritosSalvosAtualmenteTodosOsPeriodos
                        : ranking === "clicks"
                          ? adminContent.cliquesUnicosPorSessaoProdutoEDiaPeriodo
                          : adminContent.pagamentosAprovadosPeriodoSelecionado}
                    </p>
                  </div>
                </div>
                {unavailable(
                  ranking === "clicks"
                    ? "clicks"
                    : ranking === "favorites"
                      ? "favorites"
                      : "sales",
                ) || unavailable("products") ? (
                  <div className={adminStyles.dashEmpty}>
                    {adminContent.rankingIndisponivel}
                  </div>
                ) : (
                  rankList(
                    rows,
                    ranking === "favorites"
                      ? "favoritos"
                      : ranking === "clicks"
                        ? "cliques"
                        : "un.",
                  )
                )}
                {ranking === "clicks" && (
                  <p className={adminStyles.dashFootnote}>
                    {adminContent.coletaIniciadaEm30092026CliquesDe}
                  </p>
                )}
              </article>
              <article className={[adminStyles.dashCard, adminStyles.dashBlue].join(" ")}>
                <p className={adminStyles.dashKicker}>{adminContent.catalogoAgora}</p>
                <h2>{adminContent.umaVisaoDaSuaSelecao}</h2>
                <dl className={adminStyles.dashCatalog}>
                  <div>
                    <dt>{adminContent.produtosCadastrados}</dt>
                    <dd>{unavailable("products") ? "—" : data.products.length}</dd>
                  </div>
                  <div>
                    <dt>{adminContent.ativosNaLoja}</dt>
                    <dd>
                      {unavailable("products")
                        ? "—"
                        : data.products.filter((p) => p.active).length}
                    </dd>
                  </div>
                  <div>
                    <dt>{adminContent.favoritosSalvos}</dt>
                    <dd>{unavailable("favorites") ? "—" : data.favorites.length}</dd>
                  </div>
                </dl>
                <Link href="/admin/produtos">
                  {adminContent.gerenciarCatalogo}
                  <ArrowUpRight size={17} />
                </Link>
              </article>
            </div>
          </>
        )}
        {tab === 2 && (
          <div className={adminStyles.dashGrid}>
            <article className={adminStyles.dashCard}>
              <div className={adminStyles.dashCardTitle}>
                <div>
                  <h2>{adminContent.atencaoAoEstoque}</h2>
                  <p>{adminContent.produtosAtivosComAte5UnidadesSituacaoAtual}</p>
                </div>
                <Link href="/admin/estoque">{adminContent.verTodos}</Link>
              </div>
              {unavailable("products") ? (
                <div className={adminStyles.dashEmpty}>
                  {adminContent.estoqueIndisponivel}
                </div>
              ) : low.length ? (
                <ol className={adminStyles.dashStock}>
                  {low.slice(0, 5).map((p) => (
                    <li key={p.id}>
                      <Link href={"/admin/produtos/" + p.id + "/editar"}>{p.name}</Link>
                      <span className={p.stock <= 0 ? "out" : ""}>
                        {p.stock <= 0 ? adminContent.esgotado : p.stock + " un."}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className={adminStyles.dashEmpty}>
                  {adminContent.nenhumProdutoAtivoComEstoqueBaixo}
                </div>
              )}
            </article>
            <article className={adminStyles.dashCard}>
              <div className={adminStyles.dashCardTitle}>
                <div>
                  <h2>{adminContent.pagamentosNoPeriodo}</h2>
                  <p>
                    {adminContent.statusAtualDosPedidosCriadosNosUltimos}
                    {days}
                    {adminContent.dias}
                  </p>
                </div>
              </div>
              {unavailable("orders") ? (
                <div className={adminStyles.dashEmpty}>
                  {adminContent.pedidosIndisponiveis}
                </div>
              ) : (
                <dl className={adminStyles.dashCatalog}>
                  {[
                    { status: "approved", label: adminContent.aprovados },
                    { status: "pending", label: adminContent.pendentes },
                    { status: "rejected", label: adminContent.recusados },
                    { status: "cancelled", label: adminContent.cancelados },
                    { status: "refunded", label: adminContent.reembolsados },
                    { status: "expired", label: adminContent.expirados },
                  ].map((s) => (
                    <div key={s.status}>
                      <dt>{s.label}</dt>
                      <dd>{orders.filter((o) => o.status === s.status).length}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <Link className={adminStyles.dashLink} href="/admin/pedidos">
                {adminContent.gerenciarPedidos}
              </Link>
            </article>
          </div>
        )}
      </div>
    </section>
  );
}
