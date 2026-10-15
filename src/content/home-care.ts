import type { ProductType } from "./product-types";

type CareSelection = {
  id: string;
  gender: "Masculino" | "Feminino";
  types: ProductType[];
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  image: string;
  imageAlt: string;
  links: { label: string; href: string }[];
};

export const homeCareContent = {
  mensPerfumes: "Perfumes masculinos",
  forHim: "Na rotina dele",
  forHer: "Um momento para ela",
  signature: "BEECAH COLLECTION",
  selection: "Escolhas para sua rotina",
  empty: "Estamos preparando esta seleção. Enquanto isso, explore a coleção completa.",
  explore: "Explorar a coleção",
  catalog: "/perfumes",
  sections: [
    {
      id: "cuidados-masculinos",
      gender: "Masculino",
      types: ["body-splash", "body-cream", "skin-cream"],
      eyebrow: "Para ele · cuidados do dia a dia",
      title: "Banho tomado,",
      accent: "dia renovado.",
      description:
        "O frescor do body splash, o cuidado do creme. Encontre seus favoritos para usar depois do banho e ao longo do dia.",
      image: "/images/optimized/masculino-608053910e.webp",
      imageAlt: "Composição da coleção masculina Beecah",
      links: [
        {
          label: "Body splash masculino",
          href: "/categorias/body-splash?genero=Masculino",
        },
        {
          label: "Cremes masculinos",
          href: "/categorias/creme-corporal?genero=Masculino",
        },
      ],
    },
    {
      id: "cuidados-femininos",
      gender: "Feminino",
      types: ["body-cream", "skin-cream"],
      eyebrow: "Para ela · corpo e pele",
      title: "Um cuidado",
      accent: "só seu.",
      description:
        "Texturas e fragrâncias para o seu momento de cuidado. Explore os cremes para o corpo e para a pele e escolha o que combina com sua rotina.",
      image: "/images/optimized/bento4-5072a42b2e.webp",
      imageAlt: "Composição da coleção feminina Beecah",
      links: [
        { label: "Cremes corporais", href: "/categorias/creme-corporal?genero=Feminino" },
        {
          label: "Cuidados com a pele",
          href: "/categorias/creme-para-a-pele?genero=Feminino",
        },
      ],
    },
  ] satisfies CareSelection[],
};
