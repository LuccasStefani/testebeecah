import {
  productTypeContent,
  productTypeCollections,
  parseProductType,
} from "@/src/content/product-types";
import { catalogContent } from "@/src/content/catalog";
import type { Product } from "@/src/types/product";

export const collections = {
  ...productTypeContent.collections,
  arabes: {
    title: catalogContent.perfumesArabes,
    description: catalogContent.exploreASelecaoArabeDaBeecahEscolhaPor,
  },
  feminino: {
    title: catalogContent.perfumesFemininos,
    description:
      catalogContent.fragranciasFemininasParaDescobrirSuaProximaAssinaturaInclui,
  },
  masculino: {
    title: catalogContent.perfumesMasculinos,
    description: catalogContent.exploreOsPerfumesMasculinosIncluindoASelecaoArabe,
  },
  unissex: {
    title: catalogContent.perfumesUnissex,
    description: catalogContent.umaSelecaoParaEscolherPeloQueVoceGosta,
  },
  novos: {
    title: catalogContent.novosPerfumes,
    description: catalogContent.conhecaOsPerfumesMarcadosComoNovidadePelaBeecah,
  },
  "mais-vendidos": {
    title: catalogContent.maisVendidos,
    description: catalogContent.osPerfumesMaisVendidosPorQuantidadeEmPedidos,
  },
} as const;
export type CollectionKey = keyof typeof collections;
export function selectCollection(
  products: Product[],
  collection: CollectionKey,
  ranking: string[] = [],
) {
  if (Object.hasOwn(productTypeCollections, collection)) {
    const type =
      productTypeCollections[collection as keyof typeof productTypeCollections];
    return products.filter((p) => parseProductType(p.productType) === type);
  }
  if (collection === "mais-vendidos") {
    const positions = new Map(ranking.map((id, index) => [id, index]));
    return products
      .filter((p) => positions.has(p.id))
      .sort((a, b) => positions.get(a.id)! - positions.get(b.id)!);
  }
  return products.filter((p) =>
    collection === "arabes"
      ? p.isArabian === true
      : collection === "novos"
        ? p.isNew === true
        : p.category ===
          (
            {
              feminino: "Feminino",
              masculino: "Masculino",
              unissex: "Unissex",
            } as Record<string, string>
          )[collection],
  );
}
