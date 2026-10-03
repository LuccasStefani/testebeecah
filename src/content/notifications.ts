import type { ContentDictionary } from "./types";

export const notificationContent = {
  region: "Notificações",
  close: "Fechar notificação",
  login: "Você entrou na sua conta",
  logout: "Você saiu da sua conta",
  registered: "Conta criada com sucesso",
  favoriteAdded: "Salvo nos seus favoritos",
  favoriteRemoved: "Removido dos favoritos",
  favoriteError: "Não foi possível atualizar seus favoritos. Tente novamente.",
  loginRequired: "Entre na sua conta para salvar favoritos",
  cartAdded: "Adicionado à sacola",
  cartRemoved: "Produto removido da sacola",
  cartUpdated: "Quantidade atualizada",
  cartCleared: "Sua sacola foi esvaziada",
  cartError: "Não foi possível atualizar a sacola. Tente novamente.",
  outOfStock: "Este perfume está esgotado",
  stockLimit: "Você já adicionou o estoque disponível deste perfume",
  productCreated: "Perfume cadastrado com sucesso",
  productDeleted: "Perfume excluído com sucesso",
} as const satisfies ContentDictionary;
