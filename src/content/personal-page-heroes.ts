import { heroContent } from "./hero";

export const personalPageHeroes = {
  sobre: {
    eyebrow: "Sobre a Beecah",
    titleFirstLine: "Conheça a",
    titleAccent: "Beecah",
    description:
      "Fragrâncias que acompanham quem você é. Conheça a nossa coleção e encontre seu próximo perfume.",
    imageSrc: "/images/banners/bghero2.jpg",
  },
  carrinho: {
    eyebrow: "Minha conta",
    titleFirstLine: "Minha",
    titleAccent: "sacola",
    description:
      "Seus perfumes escolhidos, reunidos em um só lugar. Confira os itens e continue sua compra.",
    imageSrc: "/images/banners/bghero2.jpg",
  },
  favoritos: {
    eyebrow: "Minha conta",
    titleFirstLine: "Meus",
    titleAccent: "favoritos",
    description: "Perfumes que você salvou para ver depois.",
    imageSrc: "/images/banners/bghero2.jpg",
  },
} satisfies Record<
  string,
  {
    eyebrow: string;
    titleFirstLine: string;
    titleAccent: string;
    description: string;
    imageSrc: string;
  }
>;

export const personalHeroActions = {
  ...heroContent,
  primaryAction: "Explorar coleção",
  secondaryAction: "Ver todos os perfumes",
  collectionLink: "Perfumes",
  productPrefix: "Conhecer",
};
