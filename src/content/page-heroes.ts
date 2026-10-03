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
      imageAlt:
        key === "body-splash"
          ? "Body splashes Victoria’s Secret em uma composição com embalagens cor-de-rosa."
          : heroContent.imageAlt,
      primaryAction: "Explorar seleção",
      secondaryAction: "Toda a coleção",
      collectionLink:
        key === "body-splash" || key === "decantes"
          ? collections[key].title
          : heroContent.collectionLink,
    },
  };
}

export const categoryHeroes = {
  "body-splash": {
    ...categoryHero("body-splash", "Body", "Splash"),
    imageSrc: "/images/banners/bodybanner.jpg",
  },
  decantes: categoryHero("decantes", "Seus", "decantes"),
  arabes: {
    ...categoryHero("arabes", "Perfumes", "árabes"),
    imageSrc: "/images/banners/arabebanner.jpg",
    content: {
      ...categoryHero("arabes", "Perfumes", "árabes").content,
      imageAlt: "Coleção de perfumes árabes Beecah",
    },
  },
  feminino: categoryHero("feminino", "Perfumes", "femininos"),
  masculino: {
    ...categoryHero("masculino", "Perfumes", "masculinos"),
    imageSrc: "/images/banners/masculino.jpg",
    content: {
      ...categoryHero("masculino", "Perfumes", "masculinos").content,
      imageAlt: "Coleção de perfumes masculinos Beecah",
    },
  },
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
