export const productTypes = [
  "perfume",
  "body-splash",
  "decant",
  "hair-perfume",
  "body-cream",
  "skin-cream",
] as const;
export type ProductType = (typeof productTypes)[number];

export const productTypeContent = {
  label: "Tipo de produto",
  navigation: "Categorias",
  all: "Todos os tipos",
  help: "Escolha o tipo e, no campo de gênero, indique masculino, feminino ou unissex. Origem árabe e novidades continuam independentes.",
  invalid: "Selecione um tipo de produto válido.",
  labels: {
    perfume: "Perfume",
    "body-splash": "Body Splash",
    decant: "Decante",
    "hair-perfume": "Perfume de cabelo",
    "body-cream": "Creme corporal",
    "skin-cream": "Creme para a pele",
  },
  collections: {
    "body-splash": {
      title: "Body Splash",
      description:
        "Fragrâncias leves para acompanhar sua rotina. Encontre o body splash que combina com você.",
    },
    decantes: {
      title: "Decantes",
      description:
        "Seu perfume em um formato menor. Explore fragrâncias, escolha o volume e descubra sua próxima assinatura.",
    },
    "perfume-de-cabelo": {
      title: "Perfumes de cabelo",
      description:
        "Uma fragrância para acompanhar seus movimentos. Explore os perfumes de cabelo e escolha o seu.",
    },
    "creme-corporal": {
      title: "Cremes corporais",
      description:
        "Encontre seu creme corporal para os cuidados de todos os dias. Explore as opções masculinas, femininas e unissex.",
    },
    "creme-para-a-pele": {
      title: "Cremes para a pele",
      description:
        "Cuidados para fazer parte da sua rotina. Conheça os cremes para a pele e escolha de acordo com suas preferências.",
    },
  },
} as const;

export const productTypeCollections = {
  "body-splash": "body-splash",
  decantes: "decant",
  "perfume-de-cabelo": "hair-perfume",
  "creme-corporal": "body-cream",
  "creme-para-a-pele": "skin-cream",
} as const satisfies Record<keyof typeof productTypeContent.collections, ProductType>;

export function isProductType(value: unknown): value is ProductType {
  return typeof value === "string" && productTypes.some((type) => type === value);
}
export function parseProductType(value: unknown): ProductType {
  return isProductType(value) ? value : "perfume";
}
export function productTypeLabel(value: unknown): string {
  return productTypeContent.labels[parseProductType(value)];
}
export function productTypeSearchText(value: unknown): string {
  const type = parseProductType(value);
  const terms: Record<ProductType, string> = {
    perfume: "perfume perfumes",
    "body-splash": "body splash body splashes",
    decant: "decant decante decantes",
    "hair-perfume":
      "perfume de cabelo perfumes de cabelo perfume para cabelo perfumes para cabelo",
    "body-cream": "creme corporal cremes corporais creme de corpo cremes de corpo",
    "skin-cream": "creme para a pele cremes para a pele creme de pele cremes de pele",
  };
  return terms[type];
}
