import type { ContentDictionary } from "./types";

export const heroContent = {
  trust: "Confie em +50 clientes",
  titleFirstLine: "Conheça seu",
  titleAccent: "Perfume",
  titleSecondLine: "novo",
  description:
    "Perfumes que traduzem personalidade, despertam sensações e deixam sua presença por onde você passa.",
  primaryAction: "Collection perfume",
  secondaryAction: "Explorar",
  collectionLink: "Perfumes",
  imageAlt:
    "Três mulheres em uma campanha de perfumes Beecah, em um salão com lustres e detalhes dourados.",
} as const satisfies ContentDictionary;

export type HeroConfig = {
  content: { [Key in keyof typeof heroContent]: string };
  imageSrc: string;
  primaryHref: string;
  secondaryHref: string;
  collectionHref: string;
};
