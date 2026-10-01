"use client";

import { adminContent } from "@/src/content/admin";
import { adminStyles } from "@/src/styles/admin";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X, LoaderCircle, ArrowUpRight } from "lucide-react";
type Result = { id: string; title: string; detail: string; href: string; group: string };
export default function AdminSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        input.current?.focus();
      }
    }
    function outside(e: PointerEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);
  useEffect(() => {
    if (q.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/admin/search?q=" + encodeURIComponent(q), {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw Error();
        const data = await response.json();
        if (controller.signal.aborted) return;
        setResults(data.results || []);
        setError(
          data.errors?.length
            ? adminContent.naoFoiPossivelConsultar + data.errors.join(", ")
            : "",
        );
      } catch {
        if (!controller.signal.aborted)
          setError(adminContent.naoFoiPossivelBuscarTenteNovamente);
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);
  return (
    <div ref={root} className={adminStyles.adminSearch}>
      <div className={adminStyles.adminSearchField}>
        <Search size={17} />
        <input
          ref={input}
          aria-label={adminContent.buscarProdutosPedidosClientesESecoes}
          aria-controls="admin-search-results"
          placeholder={adminContent.buscarPerfumesPedidosClientes}
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setResults([]);
            setError("");
            setBusy(e.target.value.trim().length >= 2);
            setOpen(true);
          }}
        />
        {busy ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : q ? (
          <button
            aria-label={adminContent.limparBusca}
            onClick={() => {
              setQ("");
              setBusy(false);
              setResults([]);
              setError("");
              input.current?.focus();
            }}
          >
            <X size={15} />
          </button>
        ) : (
          <kbd>{adminContent.ctrlK}</kbd>
        )}
      </div>
      {open && (
        <div
          id="admin-search-results"
          className={adminStyles.adminSearchResults}
          aria-label={adminContent.resultadosDaBusca}
        >
          <div className={adminStyles.searchCaption}>
            {adminContent.buscaEmTodaAAdministracao}
            <button aria-label={adminContent.fecharBusca} onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </div>
          {q.trim().length < 2 ? (
            <p className={adminStyles.searchMessage}>
              {adminContent.digitePeloMenos2CaracteresBusquePeloNome}
            </p>
          ) : busy ? (
            <p role="status" className={adminStyles.searchMessage}>
              {adminContent.buscando}
            </p>
          ) : (
            <>
              {error && (
                <p role="alert" className={adminStyles.searchMessage}>
                  {error}
                </p>
              )}
              {!results.length && !error && (
                <p role="status" className={adminStyles.searchMessage}>
                  {adminContent.nenhumResultadoPara}
                  {q}
                  {adminContent.tenteOutroTermo}
                </p>
              )}
              {[
                adminContent.produtos,
                adminContent.pedidos,
                adminContent.clientes,
                adminContent.atalhos,
              ].map((group) => {
                const rows = results.filter((r) => r.group === group);
                return rows.length ? (
                  <section key={group}>
                    <h2>
                      {group}
                      <span>
                        {rows.length === 6 ? adminContent.ate6Resultados : rows.length}
                      </span>
                    </h2>
                    {rows.map((row) => (
                      <Link key={row.id} href={row.href} onClick={() => setOpen(false)}>
                        <span>
                          <strong>{row.title}</strong>
                          <small>{row.detail}</small>
                        </span>
                        <ArrowUpRight size={16} />
                      </Link>
                    ))}
                  </section>
                ) : null;
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
