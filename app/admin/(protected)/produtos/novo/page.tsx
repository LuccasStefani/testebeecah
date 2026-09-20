"use client";

import { FormEvent, useRef, useState } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
        throw new Error(data.message ?? "Erro ao enviar imagem.");
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
        stock: form.get("stock"),

        weight: form.get("weight"),
        width: form.get("width"),
        height: form.get("height"),
        length: form.get("length"),

        category: form.get("category"),
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
        setMessage(data.message ?? "Não foi possível cadastrar.");
        return;
      }

      const productId = data.product?.id;

      if (!productId) {
        setMessage("Produto criado, mas o ID não foi retornado.");
        return;
      }

      if (files.length > 0) {
        await uploadImages(productId);
      }

      router.push("/admin/produtos");
      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o produto."
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
        ← Produtos
      </Link>

      <div className="mt-4">
        <h1 className="text-3xl font-semibold">Novo produto</h1>

        <p className="mt-2 text-neutral-500">
          Cadastre um novo perfume na Beecah.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 space-y-10">
        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">Informações básicas</h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field
              label="Nome do perfume"
              name="name"
              required
              placeholder="Ex: Khamrah Qahwa"
            />

            <Field
              label="Marca"
              name="brand"
              required
              placeholder="Ex: Lattafa"
            />

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium"
              >
                Categoria
              </label>

              <select
                id="category"
                name="category"
                required
                defaultValue=""
                className="w-full border border-neutral-300 bg-white px-4 py-3"
              >
                <option value="" disabled>
                  Selecione
                </option>

                <option value="Feminino">Feminino</option>

                <option value="Masculino">Masculino</option>

                <option value="Unissex">Unissex</option>
              </select>
            </div>

            <Field label="Volume" name="volume" placeholder="Ex: 100ml" />

            <Field
              label="Família olfativa"
              name="fragranceFamily"
              placeholder="Ex: Gourmand"
            />
          </div>

          <div className="mt-5">
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium"
            >
              Descrição
            </label>

            <textarea
              id="description"
              name="description"
              rows={5}
              placeholder="Descrição do perfume..."
              className="w-full resize-y border border-neutral-300 px-4 py-3"
            />
          </div>
        </div>

        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">Preço e estoque</h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <Field
              label="Preço"
              name="price"
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="249.90"
            />

            <Field
              label="Preço promocional"
              name="promoPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="219.90"
            />

            <Field
              label="Estoque"
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
          <h2 className="text-lg font-semibold">Peso e dimensões para envio</h2>

          <p className="mt-2 text-sm text-neutral-500">
            Informe o peso e as dimensões do produto já considerando a embalagem
            usada para envio.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Peso (kg)"
              name="weight"
              type="number"
              min="0.001"
              step="0.001"
              placeholder="0.650"
            />

            <Field
              label="Largura (cm)"
              name="width"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="12"
            />

            <Field
              label="Altura (cm)"
              name="height"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="18"
            />

            <Field
              label="Comprimento (cm)"
              name="length"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="10"
            />
          </div>

          <p className="mt-4 text-xs leading-5 text-neutral-500">
            Esses dados serão utilizados para calcular o frete no checkout. Se
            preencher um deles, preencha os quatro.
          </p>
        </div>

        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">Pirâmide olfativa</h2>

          <p className="mt-2 text-sm text-neutral-500">
            Separe cada nota por vírgula.
          </p>

          <div className="mt-6 space-y-5">
            <Field
              label="Notas de saída"
              name="topNotes"
              placeholder="Bergamota, Limão, Lavanda"
            />

            <Field
              label="Notas de coração"
              name="heartNotes"
              placeholder="Canela, Pralinê"
            />

            <Field
              label="Notas de fundo"
              name="baseNotes"
              placeholder="Baunilha, Âmbar, Almíscar"
            />
          </div>
        </div>

        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">Imagens</h2>

          <p className="mt-2 text-sm text-neutral-500">
            A primeira imagem será usada como capa.
          </p>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const selectedFiles = Array.from(event.target.files ?? []);

              setFiles(selectedFiles);
            }}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-6 w-full border-2 border-dashed border-neutral-300 px-6 py-10 transition hover:border-neutral-950"
          >
            <span className="block font-medium">Selecionar imagens</span>

            <span className="mt-2 block text-sm text-neutral-500">
              JPG, PNG ou WEBP
            </span>
          </button>

          {files.length > 0 && (
            <div className="mt-5 space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between border border-neutral-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>

                    <p className="mt-1 text-xs text-neutral-500">
                      {index === 0 ? "Imagem principal" : `Imagem ${index + 1}`}
                    </p>
                  </div>

                  <p className="text-xs text-neutral-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">Publicação</h2>

          <div className="mt-5 space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" name="active" defaultChecked />

              <span className="text-sm">Produto ativo na loja</span>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" name="featured" />

              <span className="text-sm">Produto em destaque</span>
            </label>
          </div>
        </div>

        {message && (
          <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {message}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Link
            href="/admin/produtos"
            className="border border-neutral-300 px-6 py-3 text-sm font-medium"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="bg-neutral-950 px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Cadastrando..." : "Cadastrar produto"}
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
