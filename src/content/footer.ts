import { productTypeContent } from "@/src/content/product-types";
import { storeContent } from "./store";

export const footerContent = {
  headline: ["Seu perfume.", "Sua presença."],
  video: "/video/videofooter.mp4",
} as const;

export const footerGroups = [
  {
    title: storeContent.explore,
    links: [
      [storeContent.todosOsPerfumes, "/perfumes"],
      [storeContent.femininos, "/categorias/feminino"],
      [storeContent.masculinos, "/categorias/masculino"],
      [storeContent.arabes, "/categorias/arabes"],
      [productTypeContent.collections["body-splash"].title, "/categorias/body-splash"],
      [productTypeContent.collections.decantes.title, "/categorias/decantes"],
      [storeContent.novos, "/categorias/novos"],
      [storeContent.maisVendidos, "/categorias/mais-vendidos"],
      [storeContent.emBreve, "/novidades"],
    ],
  },
  {
    title: storeContent.suaBeecah,
    links: [
      [storeContent.minhaConta, "/minha-conta"],
      [storeContent.meusFavoritos, "/favoritos"],
      [storeContent.minhaSacola, "/carrinho"],
      [storeContent.sobreNos, "/sobre"],
    ],
  },
  {
    title: storeContent.podemosAjudar,
    links: [
      [storeContent.atendimento, "/atendimento"],
      [storeContent.entregaEFrete, "/atendimento#envios"],
      [storeContent.acompanharPedido, "/atendimento#pedidos"],
      [storeContent.trocasEDevolucoes, "/trocas-e-devolucoes"],
    ],
  },
];
