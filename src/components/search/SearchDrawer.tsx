"use client";
import { activePromoPrice } from "@/src/lib/promotions";

import {
  productTypeContent,
  productTypeSearchText,
  parseProductType,
  type ProductType,
} from "@/src/content/product-types";

import { storeContent } from "@/src/content/store";
import SearchResultCard from "./SearchResultCard";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { supabase } from "@/src/lib/supabase/client";
import { Product } from "@/src/types/product";

type SearchDrawerProps = {
  open: boolean;
  onClose: () => void;
};

type ProductImage = {
  id: string;
  image_url: string;
  position: number;
  is_cover: boolean;
};

type SupabaseProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  price: number | string;
  promo_price: number | string | null;
  promo_ends_on: string | null;
  stock: number;
  category: string;
  product_type: ProductType;
  volume: string | null;
  fragrance_family: string | null;
  top_notes: string[] | null;
  heart_notes: string[] | null;
  base_notes: string[] | null;
  featured: boolean;
  active: boolean;
  product_images: ProductImage[] | null;
};

const sortOptions = [
  {
    value: "relevancia",
    label: storeContent.relevancia,
  },
  {
    value: "menor-preco",
    label: storeContent.menorPreco,
  },
  {
    value: "maior-preco",
    label: storeContent.maiorPreco,
  },
  {
    value: "nome",
    label: storeContent.nomeAZ,
  },
];

const categoryOptions = [
  storeContent.todas,
  storeContent.feminino,
  storeContent.masculino,
  storeContent.unissex,
];

export default function SearchDrawer({ open, onClose }: SearchDrawerProps) {
  /* =========================================
     PRODUTOS
  ========================================= */

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* =========================================
     BUSCA
  ========================================= */

  const [productType, setProductType] = useState("");
  const [search, setSearch] = useState("");

  /* =========================================
     FILTROS
  ========================================= */

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [category, setCategory] = useState<string>(storeContent.todas);
  const [brand, setBrand] = useState<string>(storeContent.todas);
  const [sort, setSort] = useState("relevancia");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  /* =========================================
     CARREGAR PRODUTOS
  ========================================= */

  useEffect(() => {
    if (!open || loaded) return;

    async function loadProducts() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("products")
        .select(
          "\n          id,\n          name,\n          slug,\n          brand,\n          description,\n          price,\n          promo_price,promo_ends_on,\n          stock,\n          category,\n          product_type,\n          volume,\n          fragrance_family,\n          top_notes,\n          heart_notes,\n          base_notes,\n          featured,\n          active,\n          product_images (\n            id,\n            image_url,\n            position,\n            is_cover\n          )\n        ",
        )
        .eq("active", true)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(storeContent.erroAoCarregarProdutosDaBusca, error);

        setError(storeContent.naoFoiPossivelCarregarOsPerfumes);

        setLoading(false);
        return;
      }

      const formattedProducts: Product[] = ((data ?? []) as SupabaseProduct[]).map(
        (product) => {
          const sortedImages = [...(product.product_images ?? [])].sort(
            (a, b) => a.position - b.position,
          );

          const coverImage =
            sortedImages.find((image) => image.is_cover) ?? sortedImages[0];

          return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            brand: product.brand,
            description: product.description,

            price: Number(product.price),

            promoPrice: activePromoPrice(product),
            promoEndsOn: product.promo_ends_on,

            stock: product.stock,
            category: product.category,
            productType: parseProductType(product.product_type),

            volume: product.volume ?? undefined,

            fragranceFamily: product.fragrance_family ?? undefined,

            topNotes: product.top_notes ?? [],

            heartNotes: product.heart_notes ?? [],

            baseNotes: product.base_notes ?? [],

            featured: product.featured,
            active: product.active,

            imageUrl: coverImage?.image_url ?? "/images/products/placeholder.webp",

            images: sortedImages.map((image) => image.image_url),
          };
        },
      );

      setProducts(formattedProducts);
      setLoaded(true);
      setLoading(false);
    }

    loadProducts();
  }, [open, loaded]);

  /* =========================================
     BLOQUEAR SCROLL
  ========================================= */

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  /* =========================================
     FECHAR COM ESC
  ========================================= */

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  /* =========================================
     MARCAS
  ========================================= */

  const brands = useMemo(() => {
    return [
      storeContent.todas,
      ...Array.from(new Set(products.map((product) => product.brand).filter(Boolean))),
    ];
  }, [products]);

  /* =========================================
     FILTRAGEM
  ========================================= */

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    const minimum = minPrice === "" ? null : Number(minPrice);

    const maximum = maxPrice === "" ? null : Number(maxPrice);

    const filtered = products.filter((product) => {
      const finalPrice = product.promoPrice ?? product.price;

      const matchesSearch =
        !term ||
        productTypeSearchText(product.productType).toLowerCase().includes(term) ||
        product.name.toLowerCase().includes(term) ||
        product.brand.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term);

      const matchesCategory = category === "Todas" || product.category === category;

      const matchesBrand = brand === "Todas" || product.brand === brand;

      const matchesMinPrice = minimum === null || finalPrice >= minimum;

      const matchesMaxPrice = maximum === null || finalPrice <= maximum;

      return (
        matchesSearch &&
        matchesCategory &&
        (!productType || parseProductType(product.productType) === productType) &&
        matchesBrand &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });

    return [...filtered].sort((a, b) => {
      const priceA = a.promoPrice ?? a.price;

      const priceB = b.promoPrice ?? b.price;

      if (sort === "menor-preco") {
        return priceA - priceB;
      }

      if (sort === "maior-preco") {
        return priceB - priceA;
      }

      if (sort === "nome") {
        return a.name.localeCompare(b.name, "pt-BR");
      }

      return 0;
    });
  }, [products, search, category, brand, sort, minPrice, maxPrice, productType]);

  /* =========================================
     LIMPAR FILTROS
  ========================================= */

  function clearFilters() {
    setProductType("");
    setCategory(storeContent.todas);
    setBrand(storeContent.todas);
    setSort("relevancia");
    setMinPrice("");
    setMaxPrice("");
  }

  const hasFilters =
    productType !== "" ||
    category !== "Todas" ||
    brand !== "Todas" ||
    sort !== "relevancia" ||
    minPrice !== "" ||
    maxPrice !== "";

  /* =========================================
     PREÇO
  ========================================= */

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200]">
          {/* =================================
              OVERLAY
          ================================== */}

          <motion.button
            type="button"
            aria-label={storeContent.fecharBusca}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.25,
            }}
            className="
              absolute
              inset-0
              h-full
              w-full
              cursor-default
              bg-beecah-black/15
              backdrop-blur-[6px]
            "
          />

          {/* =================================
              ESPAÇO NAS QUATRO LATERAIS
          ================================== */}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              flex
              justify-end
              p-3
              sm:p-4
              lg:p-5
            "
          >
            {/* ===============================
                DRAWER
            ================================ */}

            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={storeContent.buscarPerfumes}
              initial={{
                x: "calc(100% + 40px)",
                opacity: 0,
              }}
              animate={{
                x: 0,
                opacity: 1,
              }}
              exit={{
                x: "calc(100% + 40px)",
                opacity: 0,
              }}
              transition={{
                duration: 0.42,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="
                pointer-events-auto
                flex
                h-full
                w-full
                flex-col
                overflow-hidden
                rounded-[26px]
                bg-[#e7e7e7]
                shadow-2xl

                sm:max-w-[620px]
                lg:max-w-[680px]
              "
            >
              {/* ===============================
                  CABEÇALHO
              ================================ */}

              <div
                className="
                  shrink-0
                  px-4
                  pb-4
                  pt-4
                  sm:px-6
                  sm:pt-6
                "
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* FECHAR */}

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={storeContent.fecharBusca}
                    className="
                      flex
                      h-11 sm:h-14
                      w-11 sm:w-14
                      shrink-0
                      items-center
                      justify-center
                      rounded-[16px]
                      bg-beecah-black
                      text-beecah-white
                      transition
                      duration-200
                      hover:scale-[0.97]
                      hover:opacity-85
                    "
                  >
                    <X size={21} strokeWidth={1.7} />
                  </button>

                  {/* BUSCA */}

                  <div
                    className="
                      flex
                      h-11 sm:h-14
                      min-w-0
                      flex-1
                      items-center
                      rounded-[16px]
                      bg-beecah-black
                      px-3 sm:px-5
                      text-beecah-white
                    "
                  >
                    <Search size={21} strokeWidth={1.7} className="shrink-0" />

                    <input
                      type="search"
                      aria-label="Buscar perfumes"
                      value={search}
                      autoFocus
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={storeContent.procurePorUmPerfume}
                      className="
                        min-w-0
                        flex-1
                        bg-transparent
                        pl-2
                        text-base
                        text-beecah-white
                        outline-none
                        placeholder:text-white/45
                      "
                    />
                  </div>

                  {/* FILTRO */}

                  <button
                    type="button"
                    onClick={() => setFiltersOpen((current) => !current)}
                    aria-label="Filtrar perfumes"
                    aria-expanded={filtersOpen}
                    className={`
                      flex
                      h-11 sm:h-14
                      shrink-0
                      items-center
                      justify-center
                      gap-2.5
                      rounded-[16px]
                      px-4
                      text-[13px]
                      font-medium
                      transition
                      duration-200

                      ${
                        filtersOpen || hasFilters
                          ? "bg-beecah-blue text-beecah-white"
                          : "bg-beecah-black text-beecah-white hover:opacity-85"
                      }
                    `}
                  >
                    <span className="hidden sm:inline">{storeContent.filtrarPor}</span>

                    <SlidersHorizontal size={18} strokeWidth={1.7} />
                  </button>
                </div>

                {/* =============================
                    PAINEL DE FILTROS
                ============================== */}

                <AnimatePresence>
                  {filtersOpen && (
                    <motion.div
                      initial={{
                        height: 0,
                        opacity: 0,
                        y: -5,
                      }}
                      animate={{
                        height: "auto",
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        y: -5,
                      }}
                      transition={{
                        duration: 0.28,
                      }}
                      className="max-h-[min(28rem,calc(100dvh-160px))] overflow-y-auto overscroll-contain"
                      data-lenis-prevent
                    >
                      <div
                        className="
                          mt-4
                          rounded-[22px]
                          bg-beecah-white
                          p-5
                          sm:p-6
                        "
                      >
                        {/* CABEÇALHO DOS FILTROS */}

                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3
                              className="
                                text-[17px]
                                font-semibold
                                text-beecah-black
                              "
                            >
                              {storeContent.filtros}
                            </h3>

                            <p
                              className="
                                mt-0.5
                                text-[12px]
                                text-beecah-black/45
                              "
                            >
                              {storeContent.refineOsPerfumesExibidos}
                            </p>
                          </div>

                          {hasFilters && (
                            <button
                              type="button"
                              onClick={clearFilters}
                              className="
                                rounded-full
                                bg-neutral-100
                                px-3.5
                                py-2
                                text-[11px]
                                font-medium
                                text-beecah-black/65
                                transition
                                hover:bg-neutral-200
                              "
                            >
                              {storeContent.limparFiltros}
                            </button>
                          )}
                        </div>

                        {/* ===================
                            CATEGORIA
                        ==================== */}

                        <div className="mt-6">
                          <label className="block text-sm">
                            {productTypeContent.label}
                            <select
                              value={productType}
                              onChange={(event) => setProductType(event.target.value)}
                              className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
                            >
                              <option value="">{productTypeContent.all}</option>
                              {Object.entries(productTypeContent.labels).map(
                                ([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ),
                              )}
                            </select>
                          </label>
                        </div>
                        <div className="mt-6">
                          <p
                            className="
                              text-[13px]
                              font-medium
                              text-beecah-black
                            "
                          >
                            {storeContent.categoria}
                          </p>

                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {categoryOptions.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setCategory(item)}
                                className={`
                                    rounded-full
                                    border
                                    px-4
                                    py-2.5
                                    text-[12px]
                                    font-medium
                                    transition
                                    duration-200

                                    ${
                                      category === item
                                        ? "border-beecah-blue bg-beecah-blue text-beecah-white shadow-sm"
                                        : "border-neutral-200 bg-neutral-50 text-beecah-black/65 hover:border-beecah-blue/30 hover:bg-neutral-100"
                                    }
                                  `}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ===================
                            MARCA
                        ==================== */}

                        <div className="mt-6">
                          <p
                            className="
                              text-[13px]
                              font-medium
                              text-beecah-black
                            "
                          >
                            {storeContent.marca}
                          </p>

                          <div
                            className="
                              mt-2.5
                              flex
                              max-h-[96px]
                              flex-wrap
                              gap-2
                              overflow-y-auto
                              pr-1
                            "
                          >
                            {brands.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setBrand(item)}
                                className={`
                                    rounded-full
                                    border
                                    px-4
                                    py-2.5
                                    text-[12px]
                                    font-medium
                                    transition
                                    duration-200

                                    ${
                                      brand === item
                                        ? "border-beecah-black bg-beecah-black text-beecah-white shadow-sm"
                                        : "border-neutral-200 bg-neutral-50 text-beecah-black/65 hover:border-beecah-black/25 hover:bg-neutral-100"
                                    }
                                  `}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ===================
                            PREÇO
                        ==================== */}

                        <div className="mt-6">
                          <p
                            className="
                              text-[13px]
                              font-medium
                              text-beecah-black
                            "
                          >
                            {storeContent.faixaDePreco}
                          </p>

                          <div
                            className="
                              mt-2.5
                              grid
                              grid-cols-1
                              gap-3
                              sm:grid-cols-2
                            "
                          >
                            {/* MÍNIMO */}

                            <label
                              className="
                                flex
                                h-12
                                items-center
                                rounded-[13px]
                                border
                                border-neutral-200
                                bg-neutral-50
                                px-4
                                transition
                                focus-within:border-beecah-black/50
                                focus-within:bg-beecah-white
                              "
                            >
                              <span
                                className="
                                  mr-2.5
                                  text-[12px]
                                  font-medium
                                  text-beecah-black/40
                                "
                              >
                                {storeContent.r}
                              </span>

                              <input
                                type="number"
                                min="0"
                                value={minPrice}
                                onChange={(event) => setMinPrice(event.target.value)}
                                placeholder={storeContent.precoMinimo}
                                className="
                                  min-w-0
                                  flex-1
                                  bg-transparent
                                  text-[13px]
                                  text-beecah-black
                                  outline-none
                                  placeholder:text-beecah-black/35
                                "
                              />
                            </label>

                            {/* MÁXIMO */}

                            <label
                              className="
                                flex
                                h-12
                                items-center
                                rounded-[13px]
                                border
                                border-neutral-200
                                bg-neutral-50
                                px-4
                                transition
                                focus-within:border-beecah-black/50
                                focus-within:bg-beecah-white
                              "
                            >
                              <span
                                className="
                                  mr-2.5
                                  text-[12px]
                                  font-medium
                                  text-beecah-black/40
                                "
                              >
                                {storeContent.r}
                              </span>

                              <input
                                type="number"
                                min="0"
                                value={maxPrice}
                                onChange={(event) => setMaxPrice(event.target.value)}
                                placeholder={storeContent.precoMaximo}
                                className="
                                  min-w-0
                                  flex-1
                                  bg-transparent
                                  text-[13px]
                                  text-beecah-black
                                  outline-none
                                  placeholder:text-beecah-black/35
                                "
                              />
                            </label>
                          </div>
                        </div>

                        {/* ===================
                            ORDENAÇÃO
                        ==================== */}

                        <div className="mt-6">
                          <p
                            className="
                              text-[13px]
                              font-medium
                              text-beecah-black
                            "
                          >
                            {storeContent.ordenarPor}
                          </p>

                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {sortOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setSort(option.value)}
                                className={`
                                    rounded-full
                                    border
                                    px-4
                                    py-2.5
                                    text-[12px]
                                    font-medium
                                    transition
                                    duration-200

                                    ${
                                      sort === option.value
                                        ? "border-beecah-black bg-beecah-black text-beecah-white shadow-sm"
                                        : "border-neutral-200 bg-neutral-50 text-beecah-black/65 hover:border-beecah-black/25 hover:bg-neutral-100"
                                    }
                                  `}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ===============================
                  RESULTADOS
              ================================ */}

              <div
                className="
                  min-h-0
                  flex-1
                  overflow-y-auto
                  px-4
                  pb-6
                  sm:px-6
                "
              >
                {/* LOADING */}

                {loading && (
                  <div className="space-y-3 pt-2">
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="
                            h-[148px]
                            animate-pulse
                            rounded-[22px]
                            bg-white/60
                          "
                      />
                    ))}
                  </div>
                )}

                {/* ERRO */}

                {!loading && error && (
                  <div
                    className="
                      mt-2
                      rounded-[22px]
                      bg-beecah-white
                      p-8
                      text-center
                    "
                  >
                    <p
                      className="
                        text-[14px]
                        text-beecah-black
                      "
                    >
                      {error}
                    </p>
                  </div>
                )}

                {/* PRODUTOS */}

                {!loading && !error && loaded && (
                  <>
                    {/* CONTADOR */}

                    <div
                      className="
                          mb-4
                          flex
                          items-center
                          justify-between
                          px-1
                        "
                    >
                      <p
                        className="
                            text-[13px]
                            text-beecah-black/50
                          "
                      >
                        {filteredProducts.length}{" "}
                        {filteredProducts.length === 1
                          ? storeContent.perfumeEncontrado
                          : storeContent.perfumesEncontrados}
                      </p>

                      {hasFilters && (
                        <span
                          className="
                              rounded-full
                              bg-beecah-blue/10
                              px-3
                              py-1.5
                              text-[10px]
                              font-medium
                              text-beecah-blue
                            "
                        >
                          {storeContent.filtrosAtivos}
                        </span>
                      )}
                    </div>

                    {/* LISTA */}

                    {filteredProducts.length > 0 ? (
                      <motion.div layout className="space-y-3">
                        <AnimatePresence mode="popLayout">
                          {filteredProducts.map((product) => {
                            return (
                              <motion.div
                                layout
                                key={product.id}
                                initial={{
                                  opacity: 0,
                                  y: 10,
                                }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                }}
                                exit={{
                                  opacity: 0,
                                  scale: 0.98,
                                }}
                                transition={{
                                  duration: 0.18,
                                }}
                              >
                                <SearchResultCard product={product} onSelect={onClose} />
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </motion.div>
                    ) : (
                      /* SEM RESULTADOS */

                      <motion.div
                        initial={{
                          opacity: 0,
                          y: 5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className="
                            rounded-[22px]
                            bg-beecah-white
                            px-6
                            py-16
                            text-center
                          "
                      >
                        <div
                          className="
                              mx-auto
                              flex
                              h-11 sm:h-14
                              w-11 sm:w-14
                              items-center
                              justify-center
                              rounded-full
                              bg-neutral-100
                            "
                        >
                          <Search
                            size={22}
                            strokeWidth={1.5}
                            className="text-beecah-black/40"
                          />
                        </div>

                        <h3
                          className="
                              mt-5
                              text-[17px]
                              font-medium
                              text-beecah-black
                            "
                        >
                          {storeContent.nenhumPerfumeEncontrado}
                        </h3>

                        <p
                          className="
                              mx-auto
                              mt-2
                              max-w-[300px]
                              text-[13px]
                              leading-relaxed
                              text-beecah-black/45
                            "
                        >
                          {storeContent.tentePesquisarOutroNomeMarcaOuCategoria}
                        </p>

                        {hasFilters && (
                          <button
                            type="button"
                            onClick={clearFilters}
                            className="
                                mt-5
                                rounded-full
                                bg-beecah-black
                                px-5
                                py-2.5
                                text-[12px]
                                font-medium
                                text-beecah-white
                                transition
                                hover:opacity-85
                              "
                          >
                            {storeContent.limparFiltros}
                          </button>
                        )}
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </motion.aside>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
