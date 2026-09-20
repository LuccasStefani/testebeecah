"use client";

import {
  ChangeEvent,
  FormEvent,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ProductImage = {
  id: string;
  imageUrl: string;
  position: number;
  isCover: boolean;
};

type Product = {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  promoPrice: number | null;
  stock: number;

  weight: number | null;
  width: number | null;
  height: number | null;
  length: number | null;

  category: string;
  volume: string;
  fragranceFamily: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  featured: boolean;
  active: boolean;
  images: ProductImage[];
};

type Props = {
  product: Product;
};

function notesToArray(value: string) {
  return value
    .split(",")
    .map((note) => note.trim())
    .filter(Boolean);
}

export default function EditProductForm({
  product,
}: Props) {
  const router = useRouter();

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [loading, setLoading] =
    useState(false);

  const [
    changingCoverId,
    setChangingCoverId,
  ] = useState<string | null>(null);

  const [
    deletingImageId,
    setDeletingImageId,
  ] = useState<string | null>(null);

  const [
    uploadingImages,
    setUploadingImages,
  ] = useState(false);

  const [
    deletingProduct,
    setDeletingProduct,
  ] = useState(false);

  const [selectedFiles, setSelectedFiles] =
    useState<File[]>([]);

  const [message, setMessage] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const form = new FormData(
        event.currentTarget
      );

      const payload = {
        name: form.get("name"),
        brand: form.get("brand"),
        description:
          form.get("description"),

        price: form.get("price"),
        promoPrice:
          form.get("promoPrice"),
        stock: form.get("stock"),

        weight: form.get("weight"),
        width: form.get("width"),
        height: form.get("height"),
        length: form.get("length"),

        category: form.get("category"),
        volume: form.get("volume"),

        fragranceFamily:
          form.get("fragranceFamily"),

        topNotes: notesToArray(
          String(
            form.get("topNotes") ?? ""
          )
        ),

        heartNotes: notesToArray(
          String(
            form.get("heartNotes") ?? ""
          )
        ),

        baseNotes: notesToArray(
          String(
            form.get("baseNotes") ?? ""
          )
        ),

        featured:
          form.get("featured") === "on",

        active:
          form.get("active") === "on",
      };

      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ??
            "Não foi possível atualizar o produto."
        );

        return;
      }

      setMessage(
        "Produto atualizado com sucesso!"
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        "Não foi possível atualizar o produto."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSetCover(
    imageId: string
  ) {
    try {
      setChangingCoverId(imageId);
      setMessage("");

      const response = await fetch(
        `/api/admin/product-images/${imageId}/cover`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ??
            "Não foi possível alterar a capa."
        );

        return;
      }

      setMessage(
        "Imagem principal alterada com sucesso!"
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        "Não foi possível alterar a capa."
      );
    } finally {
      setChangingCoverId(null);
    }
  }

  async function handleDeleteImage(
    imageId: string
  ) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta imagem?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingImageId(imageId);
      setMessage("");

      const response = await fetch(
        `/api/admin/product-images/${imageId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ??
            "Não foi possível excluir a imagem."
        );

        return;
      }

      if (data.warning) {
        setMessage(data.warning);
      } else {
        setMessage(
          "Imagem excluída com sucesso!"
        );
      }

      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        "Não foi possível excluir a imagem."
      );
    } finally {
      setDeletingImageId(null);
    }
  }

  function handleSelectFiles(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files ?? []
    );

    setSelectedFiles(files);
    setMessage("");
  }

  function handleRemoveSelectedFile(
    indexToRemove: number
  ) {
    setSelectedFiles(
      (currentFiles) =>
        currentFiles.filter(
          (_, index) =>
            index !== indexToRemove
        )
    );
  }

  async function handleUploadImages() {
    if (selectedFiles.length === 0) {
      setMessage(
        "Selecione pelo menos uma imagem."
      );

      return;
    }

    try {
      setUploadingImages(true);
      setMessage("");

      const positions =
        product.images.map((image) =>
          Number(image.position)
        );

      const highestPosition =
        positions.length > 0
          ? Math.max(...positions)
          : -1;

      const shouldCreateCover =
        product.images.length === 0;

      for (
        let index = 0;
        index < selectedFiles.length;
        index++
      ) {
        const file =
          selectedFiles[index];

        const formData =
          new FormData();

        formData.append("file", file);

        formData.append(
          "productId",
          product.id
        );

        formData.append(
          "position",
          String(
            highestPosition +
              index +
              1
          )
        );

        formData.append(
          "isCover",
          String(
            shouldCreateCover &&
              index === 0
          )
        );

        const response = await fetch(
          "/api/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ??
              `Não foi possível enviar ${file.name}.`
          );
        }
      }

      const uploadedCount =
        selectedFiles.length;

      setSelectedFiles([]);

      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }

      setMessage(
        uploadedCount === 1
          ? "Imagem adicionada com sucesso!"
          : "Imagens adicionadas com sucesso!"
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar as imagens."
      );

      router.refresh();
    } finally {
      setUploadingImages(false);
    }
  }

  async function handleDeleteProduct() {
    const firstConfirmation =
      window.confirm(
        `Tem certeza que deseja excluir o produto "${product.name}"?\n\nEsta ação excluirá o produto e suas imagens permanentemente.`
      );

    if (!firstConfirmation) {
      return;
    }

    const secondConfirmation =
      window.confirm(
        "Esta ação não poderá ser desfeita. Deseja realmente continuar?"
      );

    if (!secondConfirmation) {
      return;
    }

    try {
      setDeletingProduct(true);
      setMessage("");

      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ??
            "Não foi possível excluir o produto."
        );

        return;
      }

      if (data.warning) {
        console.warn(data.warning);
      }

      router.push("/admin/produtos");
      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        "Não foi possível excluir o produto."
      );
    } finally {
      setDeletingProduct(false);
    }
  }

  const imageActionRunning =
    changingCoverId !== null ||
    deletingImageId !== null ||
    uploadingImages;

  const anyActionRunning =
    loading ||
    imageActionRunning ||
    deletingProduct;

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/admin/produtos"
        className="text-sm text-neutral-500 transition hover:text-neutral-950"
      >
        ← Produtos
      </Link>

      <div className="mt-4">
        <h1 className="text-3xl font-semibold">
          Editar produto
        </h1>

        <p className="mt-2 text-neutral-500">
          {product.name}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-10 space-y-10"
      >
        {/* INFORMAÇÕES BÁSICAS */}

        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">
            Informações básicas
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field
              label="Nome do perfume"
              name="name"
              required
              defaultValue={product.name}
            />

            <Field
              label="Marca"
              name="brand"
              required
              defaultValue={product.brand}
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
                defaultValue={
                  product.category
                }
                className="w-full border border-neutral-300 bg-white px-4 py-3"
              >
                <option value="Feminino">
                  Feminino
                </option>

                <option value="Masculino">
                  Masculino
                </option>

                <option value="Unissex">
                  Unissex
                </option>
              </select>
            </div>

            <Field
              label="Volume"
              name="volume"
              defaultValue={
                product.volume
              }
            />

            <Field
              label="Família olfativa"
              name="fragranceFamily"
              defaultValue={
                product.fragranceFamily
              }
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
              defaultValue={
                product.description
              }
              className="w-full resize-y border border-neutral-300 px-4 py-3"
            />
          </div>
        </div>

        {/* PREÇO E ESTOQUE */}

        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">
            Preço e estoque
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <Field
              label="Preço"
              name="price"
              type="number"
              required
              min="0"
              step="0.01"
              defaultValue={String(
                product.price
              )}
            />

            <Field
              label="Preço promocional"
              name="promoPrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                product.promoPrice !== null
                  ? String(
                      product.promoPrice
                    )
                  : ""
              }
            />

            <Field
              label="Estoque"
              name="stock"
              type="number"
              required
              min="0"
              step="1"
              defaultValue={String(
                product.stock
              )}
            />
          </div>
        </div>

        {/* PESO E DIMENSÕES PARA ENVIO */}

        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">
            Peso e dimensões para envio
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Informe o peso e as dimensões do produto já considerando
            a embalagem usada para envio.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Peso (kg)"
              name="weight"
              type="number"
              min="0.001"
              step="0.001"
              defaultValue={String(product.weight ?? "")}
            />

            <Field
              label="Largura (cm)"
              name="width"
              type="number"
              min="0.1"
              step="0.1"
              defaultValue={String(product.width ?? "")}
            />

            <Field
              label="Altura (cm)"
              name="height"
              type="number"
              min="0.1"
              step="0.1"
              defaultValue={String(product.height ?? "")}
            />

            <Field
              label="Comprimento (cm)"
              name="length"
              type="number"
              min="0.1"
              step="0.1"
              defaultValue={String(product.length ?? "")}
            />
          </div>

          <p className="mt-4 text-xs leading-5 text-neutral-500">
            Esses dados serão utilizados para calcular o frete no
            checkout. Se preencher um deles, preencha os quatro.
          </p>
        </div>

        {/* PIRÂMIDE OLFATIVA */}

        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">
            Pirâmide olfativa
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Separe cada nota por vírgula.
          </p>

          <div className="mt-6 space-y-5">
            <Field
              label="Notas de saída"
              name="topNotes"
              defaultValue={product.topNotes.join(
                ", "
              )}
            />

            <Field
              label="Notas de coração"
              name="heartNotes"
              defaultValue={product.heartNotes.join(
                ", "
              )}
            />

            <Field
              label="Notas de fundo"
              name="baseNotes"
              defaultValue={product.baseNotes.join(
                ", "
              )}
            />
          </div>
        </div>

        {/* IMAGENS */}

        <div className="border border-neutral-200 p-6">
          <div>
            <h2 className="text-lg font-semibold">
              Imagens do produto
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              {product.images.length}{" "}
              {product.images.length === 1
                ? "imagem cadastrada"
                : "imagens cadastradas"}
            </p>
          </div>

          {/* ADICIONAR IMAGENS */}

          <div className="mt-6 border border-dashed border-neutral-300 p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={
                anyActionRunning
              }
              onChange={
                handleSelectFiles
              }
              className="hidden"
              id="new-product-images"
            />

            <label
              htmlFor="new-product-images"
              className={`block text-center ${
                anyActionRunning
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer"
              }`}
            >
              <span className="block text-base font-medium">
                + Adicionar novas imagens
              </span>

              <span className="mt-2 block text-sm text-neutral-500">
                JPG, PNG ou WEBP
              </span>
            </label>

            {selectedFiles.length > 0 && (
              <div className="mt-6 border-t border-neutral-200 pt-5">
                <p className="text-sm font-medium">
                  {selectedFiles.length}{" "}
                  {selectedFiles.length === 1
                    ? "imagem selecionada"
                    : "imagens selecionadas"}
                </p>

                <div className="mt-4 space-y-2">
                  {selectedFiles.map(
                    (file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between gap-4 border border-neutral-200 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm">
                            {file.name}
                          </p>

                          <p className="mt-1 text-xs text-neutral-500">
                            {(
                              file.size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={
                            anyActionRunning
                          }
                          onClick={() =>
                            handleRemoveSelectedFile(
                              index
                            )
                          }
                          className="shrink-0 text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          Remover
                        </button>
                      </div>
                    )
                  )}
                </div>

                <button
                  type="button"
                  disabled={
                    anyActionRunning ||
                    selectedFiles.length ===
                      0
                  }
                  onClick={
                    handleUploadImages
                  }
                  className="mt-5 w-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadingImages
                    ? "Enviando imagens..."
                    : selectedFiles.length ===
                        1
                      ? "Enviar imagem"
                      : `Enviar ${selectedFiles.length} imagens`}
                </button>
              </div>
            )}
          </div>

          {/* IMAGENS CADASTRADAS */}

          {product.images.length === 0 ? (
            <div className="mt-6 border border-neutral-200 p-8 text-center">
              <p className="text-sm text-neutral-500">
                Nenhuma imagem cadastrada para este produto.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {product.images.map(
                (image) => (
                  <div
                    key={image.id}
                    className="overflow-hidden border border-neutral-200"
                  >
                    <div className="relative aspect-square bg-neutral-50">
                      <img
                        src={
                          image.imageUrl
                        }
                        alt={`${product.name} - imagem ${
                          image.position +
                          1
                        }`}
                        className="h-full w-full object-contain p-4"
                      />

                      {image.isCover && (
                        <span className="absolute left-3 top-3 bg-neutral-950 px-3 py-1 text-xs font-medium text-white">
                          Capa
                        </span>
                      )}
                    </div>

                    <div className="border-t border-neutral-200 p-4">
                      <p className="text-xs text-neutral-500">
                        Posição{" "}
                        {image.position}
                      </p>

                      {image.isCover ? (
                        <p className="mt-3 text-sm font-medium">
                          Imagem principal
                        </p>
                      ) : (
                        <button
                          type="button"
                          disabled={
                            anyActionRunning
                          }
                          onClick={() =>
                            handleSetCover(
                              image.id
                            )
                          }
                          className="mt-3 w-full border border-neutral-300 px-3 py-2 text-sm font-medium transition hover:border-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {changingCoverId ===
                          image.id
                            ? "Alterando..."
                            : "Definir como capa"}
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={
                          anyActionRunning
                        }
                        onClick={() =>
                          handleDeleteImage(
                            image.id
                          )
                        }
                        className="mt-3 w-full border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:border-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingImageId ===
                        image.id
                          ? "Excluindo..."
                          : "Excluir imagem"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* PUBLICAÇÃO */}

        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold">
            Publicação
          </h2>

          <div className="mt-5 space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="active"
                defaultChecked={
                  product.active
                }
              />

              <span className="text-sm">
                Produto ativo na loja
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={
                  product.featured
                }
              />

              <span className="text-sm">
                Produto em destaque
              </span>
            </label>
          </div>
        </div>

        {/* ZONA DE PERIGO */}

        <div className="border border-red-200 bg-red-50/40 p-6">
          <h2 className="text-lg font-semibold text-red-700">
            Zona de perigo
          </h2>

          <p className="mt-2 text-sm text-red-700/80">
            A exclusão remove permanentemente
            o produto da loja e também suas
            imagens.
          </p>

          <button
            type="button"
            disabled={anyActionRunning}
            onClick={handleDeleteProduct}
            className="mt-5 border border-red-600 px-5 py-3 text-sm font-medium text-red-700 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deletingProduct
              ? "Excluindo produto..."
              : "Excluir produto"}
          </button>
        </div>

        {/* MENSAGEM */}

        {message && (
          <div className="border border-neutral-200 p-4 text-sm">
            {message}
          </div>
        )}

        {/* BOTÕES */}

        <div className="flex flex-wrap justify-end gap-3">
          <Link
            href="/admin/produtos"
            className="border border-neutral-300 px-6 py-3 text-sm font-medium"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={anyActionRunning}
            className="bg-neutral-950 px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Salvando..."
              : "Salvar alterações"}
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
  min?: string;
  step?: string;
  defaultValue?: string;
};

function Field({
  label,
  name,
  type = "text",
  required = false,
  min,
  step,
  defaultValue,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        required={required}
        min={min}
        step={step}
        defaultValue={defaultValue}
        className="w-full border border-neutral-300 px-4 py-3"
      />
    </div>
  );
}