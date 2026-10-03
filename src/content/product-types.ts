export const productTypes = ["perfume", "body-splash", "decant"] as const;
export type ProductType = (typeof productTypes)[number];

export const productTypeContent = {
  label: "Tipo de produto",
  all: "Todos os tipos",
  help: "Escolha o formato. Gênero, origem árabe e novidades continuam independentes.",
  invalid: "Selecione um tipo de produto válido.",
  labels: { perfume: "Perfume", "body-splash": "Body Splash", decant: "Decante" },
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
  },
} as const;

export function isProductType(value: unknown): value is ProductType {
  return typeof value === "string" && productTypes.some((type) => type === value);
}

export function parseProductType(value: unknown): ProductType {
  return isProductType(value) ? value : "perfume";
}

export function productTypeLabel(value: unknown): string {
  return productTypeContent.labels[parseProductType(value)];
}
