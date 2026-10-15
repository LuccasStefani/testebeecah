export type BentoTile = {
  id: string;
  kind: "offer" | "collection";
  image: string;
  imagePosition?: string;
  href: string;
  title: string;
  eyebrow?: string;
  description?: string;
  action: string;
  note?: string;
  layout: string;
};

/** Imagens em ordem de leitura. Substitua os arquivos ou ajuste os caminhos aqui. */
export const bentoContent: { tiles: BentoTile[] } = {
  tiles: [
    {
      id: "ofertas",
      kind: "offer",
      image: "/images/optimized/bento1-931426ac8b.webp",
      href: "/perfumes?ofertas=true",
      eyebrow: "Oferta de Primavera",
      title: "Ganhe até\n50% Off",
      action: "Obter desconto",
      note: "• Válido até 2 de Novembro de 2026",
      layout: "min-h-96 md:col-span-8 md:min-h-0",
    },
    {
      id: "populares",
      kind: "collection",
      image: "/images/optimized/bento2-c270742d20.webp",
      href: "/categorias/decantes",
      title: "Decantes Populares",
      action: "Explorar",
      layout: "min-h-80 md:col-span-4 md:min-h-0",
    },
    {
      id: "arabes",
      kind: "collection",
      image: "/images/optimized/bento3-7fe950165b.webp",
      href: "/categorias/arabes",
      title: "Coleções\nde luxo",
      description: "Mais de 230 produtos",
      action: "Explorar",
      layout: "min-h-72 md:col-span-3 md:min-h-0",
    },
    {
      id: "feminino",
      kind: "collection",
      image: "/images/optimized/bento4-d0b99dc204.webp",
      href: "/categorias/feminino",
      title: "Coleções\nfemininas",
      description: "Mais de 230 produtos",
      action: "Explorar",
      layout: "min-h-72 md:col-span-3 md:min-h-0",
    },
    {
      id: "novos",
      kind: "collection",
      image: "/images/optimized/yara-c89c607240.webp",
      href: "/categorias/novos",
      title: "Novos\nprodutos",
      action: "Explorar",
      layout: "min-h-80 md:col-span-6 md:min-h-0",
    },
  ] satisfies BentoTile[],
};
