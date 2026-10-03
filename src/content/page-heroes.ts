import { heroContent, type HeroConfig } from "./hero";
import { catalogContent } from "./catalog";
import { collections, type CollectionKey } from "@/src/lib/product-collections";

// Edit the background, copy and links independently for each destination here.
const defaults = {
  imageSrc: "/images/banners/bghero2.jpg",
  primaryHref: "#produtos",
  secondaryHref: "/perfumes",
  collectionHref: "#produtos",
} as const;

function categoryHero(key: CollectionKey, title: string, accent: string): HeroConfig {
  return {
    ...defaults,
    content: {
      ...heroContent,
      titleFirstLine: title,
      titleAccent: accent,
      titleSecondLine: "",
      description: collections[key].description,
      primaryAction: "Explorar seleção",
      secondaryAction: "Todos os perfumes",
    },
  };
}

export const categoryHeroes = {
  arabes: categoryHero("arabes", "Perfumes", "árabes"),
  feminino: categoryHero("feminino", "Perfumes", "femininos"),
  masculino: categoryHero("masculino", "Perfumes", "masculinos"),
  unissex: categoryHero("unissex", "Perfumes", "unissex"),
  novos: categoryHero("novos", "Novos", "perfumes"),
  "mais-vendidos": categoryHero("mais-vendidos", "Mais", "vendidos"),
} satisfies Record<CollectionKey, HeroConfig>;

export const catalogHero = {
  ...defaults,
  content: {
    ...heroContent,
    titleFirstLine: "Seu próximo",
    titleAccent: "Perfume",
    titleSecondLine: "",
    description: catalogContent.encontreAFragranciaQueCombinaComVoceExplore,
    primaryAction: "Explorar coleção",
    secondaryAction: "Perfumes árabes",
  },
  secondaryHref: "/categorias/arabes",
} satisfies HeroConfig;
