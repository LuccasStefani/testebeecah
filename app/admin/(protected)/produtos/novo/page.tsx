"use client";

import { promotionContent } from "@/src/content/promotions";
import ProductImageDropzone from "@/src/components/admin/ProductImageDropzone";
import { adminControls } from "@/src/styles/admin-controls";
import ProductTypeField from "@/src/components/products/ProductTypeField";

import { useFeedbackState } from "@/src/hooks/use-feedback-state";

import { notify } from "@/src/lib/notifications";
import { notificationContent } from "@/src/content/notifications";

import { adminContent } from "@/src/content/admin";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function notesToArray(value: string) {
  return value
    .split(",")
    .map((note) => note.trim())
    .filter(Boolean);
}

export default function NewProductPage() {
  const router = useRouter();

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useFeedbackState("error");

  async function uploadImages(productId: string) {
    for (let index = 0; index < files.length; index++) {
      const file = files[index];

      const formData = new FormData();

      formData.append("file", file);
      formData.append("productId", productId);
      formData.append("position", String(index));
      formData.append("isCover", String(index === 0));

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? adminContent.erroAoEnviarImagem);
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const form = new FormData(event.currentTarget);

      const payload = {
        name: form.get("name"),
        brand: form.get("brand"),
        description: form.get("description"),

        price: form.get("price"),
        promoPrice: form.get("promoPrice"),
        promoEndsOn: form.get("promoEndsOn"),
        stock: form.get("stock"),

        weight: form.get("weight"),
        width: form.get("width"),
        height: form.get("height"),
        length: form.get("length"),

        category: form.get("category"),
        productType: form.get("productType"),
        isArabian: form.get("isArabian") === "on",
        isNew: form.get("isNew") === "on",
        volume: form.get("volume"),

        fragranceFamily: form.get("fragranceFamily"),

        topNotes: notesToArray(String(form.get("topNotes") ?? "")),

        heartNotes: notesToArray(String(form.get("heartNotes") ?? "")),

        baseNotes: notesToArray(String(form.get("baseNotes") ?? "")),

        featured: form.get("featured") === "on",

        active: form.get("active") === "on",
      };

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? adminContent.naoFoiPossivelCadastrar);
        return;
      }

      const productId = data.product?.id;

      if (!productId) {
        setMessage(adminContent.produtoCriadoMasOIdNaoFoiRetornado);
        return;
      }

      if (files.length > 0) {
        await uploadImages(productId);
      }

      notify.success(notificationContent.productCreated);
      router.push("/admin/produtos");
      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : adminContent.naoFoiPossivelCadastrarOProduto,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/admin/produtos"
        className="text-sm text-neutral-500 hover:text-neutral-950"
      >
        {adminContent.produtos2}
      </Link>

      <div className="mt-4">
        <h1 className="text-3xl font-semibold">{adminContent.novoProduto}</h1>

        <p className="mt-2 text-neutral-500">
          {adminContent.cadastreUmNovoPerfumeNaBeecah}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 space-y-10">
        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">{adminContent.informacoesBasicas}</h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field
              label={adminContent.nomeDoPerfume}
              name="name"
              required
              placeholder={adminContent.exKhamrahQahwa}
            />

            <Field
              label={adminContent.marca}
              name="brand"
              required
              placeholder={adminContent.exLattafa}
            />

            <ProductTypeField />
            <div>
              <label htmlFor="category" className="mb-2 block text-sm font-medium">
                {adminContent.generoDoPerfume}
              </label>

              <select
                id="category"
                name="category"
                required
                defaultValue=""
                className="w-full border border-neutral-300 bg-white px-4 py-3"
              >
                <option value="" disabled>
                  {adminContent.selecione}
                </option>

                <option value="Feminino">{adminContent.feminino}</option>

                <option value="Masculino">{adminContent.masculino}</option>

                <option value="Unissex">{adminContent.unissex}</option>
              </select>
              <p className="mt-2 text-xs text-neutral-500">
                {adminContent.oGeneroEAsSelecoesAbaixoSaoIndependentes}
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <label className="flex items-center gap-3">
                  <input type="checkbox" name="isArabian" className="size-4" />
                  {adminContent.perfumeArabe}
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" name="isNew" className="size-4" />
                  {adminContent.exibirEmNovos}
                </label>
                <p className="text-xs leading-5 text-neutral-500">
                  {adminContent.umPerfumeFemininoEArabeApareceNasDuas}
                </p>
              </div>
            </div>

            <Field
              label={adminContent.volume}
              name="volume"
              placeholder={adminContent.ex100ml}
            />

            <Field
              label={adminContent.familiaOlfativa}
              name="fragranceFamily"
              placeholder={adminContent.exGourmand}
            />
          </div>

          <div className="mt-5">
            <label htmlFor="description" className="mb-2 block text-sm font-medium">
              {adminContent.descricao}
            </label>

            <textarea
              id="description"
              name="description"
              rows={5}
              placeholder={adminContent.descricaoDoPerfume}
              className="w-full resize-y border border-neutral-300 px-4 py-3"
            />
          </div>
        </div>

        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">{adminContent.precoEEstoque}</h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <Field
              label={adminContent.preco}
              name="price"
              type="number"
              required
              min="0"
              step="0.01"
              placeholder={"249.90"}
            />

            <Field
              label={adminContent.precoPromocional}
              name="promoPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder={"219.90"}
            />

            <div>
              <Field label={promotionContent.deadline} name="promoEndsOn" type="date" />
              <p className="mt-2 text-xs text-neutral-400">{promotionContent.help}</p>
            </div>

            <Field
              label={adminContent.estoque}
              name="stock"
              type="number"
              required
              min="0"
              step="1"
              defaultValue="0"
            />
          </div>
        </div>

        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">
            {adminContent.pesoEDimensoesParaEnvio}
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            {adminContent.informeOPesoEAsDimensoesDoProduto}
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label={adminContent.pesoKg}
              name="weight"
              type="number"
              min="0.001"
              step="0.001"
              placeholder={"0.650"}
            />

            <Field
              label={adminContent.larguraCm}
              name="width"
              type="number"
              min="0.1"
              step="0.1"
              placeholder={"12"}
            />

            <Field
              label={adminContent.alturaCm}
              name="height"
              type="number"
              min="0.1"
              step="0.1"
              placeholder={"18"}
            />

            <Field
              label={adminContent.comprimentoCm}
              name="length"
              type="number"
              min="0.1"
              step="0.1"
              placeholder={"10"}
            />
          </div>

          <p className="mt-4 text-xs leading-5 text-neutral-500">
            {adminContent.essesDadosSeraoUtilizadosParaCalcularOFrete}
          </p>
        </div>

        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">{adminContent.piramideOlfativa}</h2>

          <p className="mt-2 text-sm text-neutral-500">
            {adminContent.separeCadaNotaPorVirgula}
          </p>

          <div className="mt-6 space-y-5">
            <Field
              label={adminContent.notasDeSaida}
              name="topNotes"
              placeholder={adminContent.bergamotaLimaoLavanda}
            />

            <Field
              label={adminContent.notasDeCoracao}
              name="heartNotes"
              placeholder={adminContent.canelaPraline}
            />

            <Field
              label={adminContent.notasDeFundo}
              name="baseNotes"
              placeholder={adminContent.baunilhaAmbarAlmiscar}
            />
          </div>
        </div>

        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">{adminContent.imagens}</h2>

          <p className="mt-2 text-sm text-neutral-500">
            {adminContent.aPrimeiraImagemSeraUsadaComoCapa}
          </p>

          <ProductImageDropzone files={files} onChange={setFiles} disabled={loading} />
        </div>

        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">{adminContent.publicacao}</h2>

          <div className="mt-5 space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" name="active" defaultChecked />

              <span className="text-sm">{adminContent.produtoAtivoNaLoja}</span>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" name="featured" />

              <span className="text-sm">{adminContent.produtoEmDestaque}</span>
            </label>
          </div>
        </div>

        {message && (
          <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {message}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Link href="/admin/produtos" className={adminControls.secondary}>
            {adminContent.cancelar}
          </Link>

          <button type="submit" disabled={loading} className={adminControls.primary}>
            {loading ? adminContent.cadastrando : adminContent.cadastrarProduto}
          </button>
        </div>
      </form>
    </section>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: string;
  step?: string;
  defaultValue?: string;
};

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  min,
  step,
  defaultValue,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        step={step}
        defaultValue={defaultValue}
        className="w-full border border-neutral-300 px-4 py-3"
      />
    </div>
  );
}
