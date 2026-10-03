import type { ContentDictionary } from "./types";

export const bodySplashContent = {
  eyebrow: "Body Splash · Beecah Collection",
  title: "Um toque de",
  accent: "leveza.",
  description:
    "Fragrâncias leves para depois do banho e para renovar ao longo do dia. Escolha as notas que combinam com você.",
  action: "Descobrir a coleção",
  href: "/categorias/body-splash",
  image: "/images/banners/bodysplashposter.jpg",
  video: "/video/usebody.mp4",
  imageAlt: "Seleção de body splashes em uma composição com embalagens cor-de-rosa.",
  signature: "BEECAH COLLECTION",
  caption: "Depois do banho,",
  captionAccent: "antes de tudo.",
  noteTitle: "Do banho ao próximo encontro.",
  note: "Escolha pelas notas que você gosta e descubra um novo jeito de usar fragrâncias.",
  selection: "Seleção de Body Splash",
  all: "Ver a coleção completa",
} as const satisfies ContentDictionary;

export const bodySplashPreviewContent = {
  eyebrow: "Body Splash",
  label: "Prévia ilustrativa",
  availability: "Coleção em preparação",
  previous: "Ver body splashes anteriores",
  next: "Ver próximos body splashes",
  region: "Vitrine de Body Splash",
  image: "/images/banners/bodybanner.jpg",
  imageAlt: "Seleção ilustrativa de body splashes Victoria’s Secret",
} as const satisfies ContentDictionary;

type BodySplashPreview = {
  name: string;
  imagePosition: string;
};

export const bodySplashPreviews: BodySplashPreview[] = [
  { name: "Pure Seduction", imagePosition: "24% center" },
  { name: "Love Spell", imagePosition: "33% center" },
  { name: "Coconut Passion", imagePosition: "40% center" },
  { name: "Bare Vanilla", imagePosition: "55% center" },
  { name: "Aqua Kiss", imagePosition: "71% center" },
  { name: "Velvet Petals", imagePosition: "85% center" },
];
