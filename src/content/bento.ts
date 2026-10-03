export type BentoTile = {
  id: string;
  kind: "offer" | "collection";
  image: string;
  href: string;
  title: string;
  eyebrow?: string;
  description?: string;
  action?: string;
  note?: string;
  layout: string;
};

/** Imagens em ordem de leitura. Substitua os arquivos ou ajuste os caminhos aqui. */
export const bentoContent: { tiles: BentoTile[] } = {
  tiles: [
    {
      id: "ofertas",
      kind: "offer",
      image: "/images/banners/bento1.jpeg",
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
      image: "/images/banners/bento2.jpeg",
      href: "/categorias/mais-vendidos",
      title: "Decantes Populares",
      layout: "min-h-80 md:col-span-4 md:min-h-0",
    },
    {
      id: "arabes",
      kind: "collection",
      image: "/images/banners/bento3.png",
      href: "/categorias/arabes",
      title: "Coleções\nde luxo",
      description: "Mais de 230 produtos",
      action: "Explorar",
      layout: "min-h-72 md:col-span-3 md:min-h-0",
    },
    {
      id: "feminino",
      kind: "collection",
      image: "/images/banners/bento4.jpg",
      href: "/categorias/feminino",
      title: "Coleções\nfemininas",
      description: "Mais de 230 produtos",
      action: "Explorar",
      layout: "min-h-72 md:col-span-3 md:min-h-0",
    },
    {
      id: "novos",
      kind: "collection",
      image: "/images/banners/yara.jpg",
      href: "/categorias/novos",
      title: "Novos\nprodutos",
      layout: "min-h-80 md:col-span-6 md:min-h-0",
    },
  ] satisfies BentoTile[],
};
