"use client";

import { useFeedbackState } from "@/src/hooks/use-feedback-state";

import { adminContent } from "@/src/content/admin";
import { useState } from "react";
import type { PopupConfig, PopupBanner } from "@/src/lib/popup-types";
type Product = {
  id: string;
  name: string;
  price: number;
  promo_price: number | null;
  active: boolean;
  stock: number;
};
export default function BannerEditor({
  initial,
  products,
}: {
  initial: PopupConfig;
  products: Product[];
}) {
  const [config, setConfig] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [message, setMessage] = useFeedbackState("success");
  const [error, setError] = useFeedbackState("error");
  const patch = (id: string, changes: Partial<PopupBanner>) => {
    setMessage("");
    setConfig((c) => ({
      ...c,
      banners: c.banners.map((b) => (b.id === id ? { ...b, ...changes } : b)),
    }));
  };
  const reorder = (i: number, d: number) =>
    setConfig((c) => {
      const banners = [...c.banners];
      [banners[i], banners[i + d]] = [banners[i + d], banners[i]];
      return { ...c, banners };
    });
  async function upload(id: string, file: File) {
    if (uploading || busy) return;
    setError("");
    setMessage("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError(adminContent.useJpgPngOuWebpDeAte10);
      return;
    }
    setUploading(id);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("bannerId", id);
      const response = await fetch("/api/admin/banners/upload", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      patch(id, { imageUrl: data.imageUrl });
      setMessage(adminContent.fotoEnviadaCliqueEmSalvarAlteracoesParaPublicar);
    } catch (e) {
      setError(e instanceof Error ? e.message : adminContent.naoFoiPossivelEnviarAFoto);
    } finally {
      setUploading(null);
    }
  }
  async function save() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/admin/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      setMessage(adminContent.bannersSalvosAbraUmaNovaSessaoDoNavegador);
    } catch (e) {
      setError(e instanceof Error ? e.message : adminContent.naoFoiPossivelSalvar);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h1 className="text-3xl">{adminContent.bannersPromocionais}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
        {adminContent.popupDeEntradaNaLojaApareceUmaVez}
      </p>
      <fieldset disabled={busy || uploading !== null} className="mt-6 space-y-5">
        <div className="flex flex-wrap items-center gap-5 rounded-2xl bg-white p-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            />
            {adminContent.ativarPopup}
          </label>
          <label className="text-sm">
            {adminContent.exibicao}
            <select
              className="ml-3 border px-3 py-2"
              value={config.mode}
              onChange={(e) =>
                setConfig({ ...config, mode: e.target.value as PopupConfig["mode"] })
              }
            >
              <option value="fixed">{adminContent.bannerFixo}</option>
              <option value="slides">{adminContent.slidesAutomaticos}</option>
            </select>
          </label>
        </div>
        <p className="text-xs leading-6 text-neutral-500">
          {adminContent.noModoFixoApareceOBannerFixadoOu}
        </p>
        {config.banners.map((b, i) => {
          const product = products.find((p) => p.id === b.productId);
          const eligible =
            product?.active &&
            product.stock > 0 &&
            product.promo_price &&
            Number(product.promo_price) < Number(product.price);
          return (
            <article key={b.id} className="rounded-2xl bg-white p-5">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <strong className="mr-auto text-sm">
                  {adminContent.banner}
                  {i + 1}
                </strong>
                <button
                  disabled={i === 0}
                  onClick={() => reorder(i, -1)}
                  className="rounded-lg bg-neutral-100 p-3 text-xs disabled:opacity-30"
                  aria-label={adminContent.moverBannerParaCima}
                >
                  {"↑"}
                </button>
                <button
                  disabled={i === config.banners.length - 1}
                  onClick={() => reorder(i, 1)}
                  className="rounded-lg bg-neutral-100 p-3 text-xs disabled:opacity-30"
                  aria-label={adminContent.moverBannerParaBaixo}
                >
                  {"↓"}
                </button>
                <label className="text-xs">
                  <input
                    type="checkbox"
                    checked={b.active}
                    onChange={(e) => patch(b.id, { active: e.target.checked })}
                  />
                  {adminContent.ativo2}
                </label>
                <label className="text-xs">
                  <input
                    type="checkbox"
                    checked={b.pinned}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        banners: c.banners.map((row) => ({
                          ...row,
                          pinned: row.id === b.id ? e.target.checked : false,
                        })),
                      }))
                    }
                  />
                  {adminContent.fixado}
                </label>
                <button
                  onClick={() => {
                    if (
                      window.confirm(adminContent.removerEsteBannerARemocaoSeraAplicadaAo)
                    )
                      setConfig((c) => ({
                        ...c,
                        banners: c.banners.filter((row) => row.id !== b.id),
                      }));
                  }}
                  className="p-2 text-xs text-red-700"
                >
                  {adminContent.remover}
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs">
                  {adminContent.produto}
                  <select
                    className="mt-2 w-full border p-3"
                    value={b.productId}
                    onChange={(e) => patch(b.id, { productId: e.target.value })}
                  >
                    <option value="">{adminContent.selecione}</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs">
                  {adminContent.titulo}
                  <input
                    className="mt-2 w-full border p-3"
                    maxLength={100}
                    value={b.title}
                    onChange={(e) => patch(b.id, { title: e.target.value })}
                  />
                </label>
                <label className="text-xs sm:col-span-2">
                  {adminContent.descricao}
                  <textarea
                    className="mt-2 w-full border p-3"
                    maxLength={300}
                    value={b.description}
                    onChange={(e) => patch(b.id, { description: e.target.value })}
                  />
                </label>
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:col-span-2">
                  <p className="text-sm font-medium">{adminContent.fotoDesteBanner}</p>
                  <p className="mt-1 text-xs leading-6 text-neutral-500">
                    {adminContent.envieUmaImagemPropriaJpgPngOuWebp}
                  </p>
                  {b.imageUrl && (
                    <div
                      role="img"
                      aria-label={adminContent.previaDaFotoDoBanner + (i + 1)}
                      className="mt-4 aspect-[4/5] w-40 rounded-xl bg-neutral-200 bg-cover bg-center"
                      style={{
                        backgroundImage: "url(" + JSON.stringify(b.imageUrl) + ")",
                      }}
                    />
                  )}
                  <div
                    role="region"
                    aria-label={adminContent.soltarImagemDoBanner + (i + 1)}
                    aria-busy={uploading === b.id}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      if (!busy && !uploading && e.dataTransfer.types.includes("Files"))
                        setDragging(b.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = busy || uploading ? "none" : "copy";
                    }}
                    onDragLeave={(e) => {
                      if (
                        !(e.relatedTarget instanceof Node) ||
                        !e.currentTarget.contains(e.relatedTarget)
                      )
                        setDragging(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(null);
                      if (busy || uploading) return;
                      const files = e.dataTransfer.files;
                      if (files.length !== 1) {
                        setError(adminContent.solteApenasUmaImagemPorBanner);
                        return;
                      }
                      void upload(b.id, files[0]);
                    }}
                    className={
                      "mt-4 flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-5 py-6 text-center transition " +
                      (dragging === b.id
                        ? "border-beecah-blue bg-blue-50"
                        : "border-neutral-300 bg-white") +
                      (busy || uploading ? " opacity-50" : "")
                    }
                  >
                    <span className="text-sm font-medium">
                      {uploading === b.id
                        ? adminContent.enviandoFoto
                        : dragging === b.id
                          ? adminContent.solteAImagemAqui
                          : adminContent.arrasteESolteAFotoAqui}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {adminContent.jpgPngOuWebpAte10Mb}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {adminContent.ouSelecioneOArquivoNoBotaoAbaixo}
                    </span>
                  </div>
                  <label className="mt-4 block text-xs font-medium">
                    {uploading === b.id
                      ? adminContent.enviandoFoto
                      : b.imageUrl
                        ? adminContent.trocarFoto
                        : adminContent.selecionarFoto}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="mt-2 block w-full text-xs file:mr-3 file:rounded-xl file:border-0 file:bg-neutral-950 file:px-4 file:py-3 file:text-white"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        e.currentTarget.value = "";
                        if (file) void upload(b.id, file);
                      }}
                    />
                  </label>
                  {b.imageUrl ? (
                    <button
                      type="button"
                      className="mt-3 min-h-11 text-xs underline underline-offset-4"
                      onClick={() => patch(b.id, { imageUrl: "" })}
                    >
                      {adminContent.removerFotoPersonalizadaEUsarADoProduto}
                    </button>
                  ) : (
                    <p className="mt-3 text-xs text-neutral-500">
                      {adminContent.semFotoPersonalizadaSeraUsadaAImagemDo}
                    </p>
                  )}
                </div>
                <label className="text-xs sm:col-span-2">
                  {adminContent.imagemPersonalizadaUrlHttpsOuCaminhoLocal}
                  <input
                    className="mt-2 w-full border p-3"
                    value={b.imageUrl}
                    placeholder={adminContent.emBrancoUsarAFotoDoProduto}
                    onChange={(e) => patch(b.id, { imageUrl: e.target.value })}
                  />
                </label>
              </div>
              {!eligible && (
                <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  {adminContent.esteProdutoNaoTemUmaPromocaoElegivelNo}
                </p>
              )}
            </article>
          );
        })}
        <button
          onClick={() =>
            setConfig((c) => ({
              ...c,
              banners: [
                ...c.banners,
                {
                  id: crypto.randomUUID(),
                  productId: "",
                  title: adminContent.umaOfertaParaVoce,
                  description: adminContent.conhecaEstaFragranciaDaSelecaoBeecah,
                  imageUrl: "",
                  active: true,
                  pinned: false,
                },
              ],
            }))
          }
          disabled={config.banners.length >= 20}
          className="rounded-xl border px-5 py-3 text-sm"
        >
          {adminContent.adicionarBanner}
        </button>
        <button
          onClick={save}
          className="ml-3 rounded-xl bg-neutral-950 px-5 py-3 text-sm text-white"
        >
          {busy ? adminContent.salvando : adminContent.salvarAlteracoes}
        </button>
      </fieldset>
      {message && (
        <p role="status" className="mt-4 text-sm text-green-700">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
