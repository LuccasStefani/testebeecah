import "server-only";

import { getMelhorEnvioAccessToken } from "@/src/lib/melhor-envio/client";

export type MelhorEnvioShipmentPerson = {
  name: string;
  email: string;
  phone: string;

  document: string;

  address: string;
  complement?: string;
  number: string;
  district: string;
  city: string;
  postal_code: string;
  state_abbr: string;

  country_id?: "BR";
};

export type MelhorEnvioShipmentProduct = {
  name: string;
  quantity: number;
  unitary_value: number;
};

export type MelhorEnvioShipmentVolume = {
  height: number;
  width: number;
  length: number;
  weight: number;
};

export type MelhorEnvioShipmentTag = {
  tag: string;
  url: string | null;
};

export type CreateMelhorEnvioCartItemPayload = {
  service: number;

  from: MelhorEnvioShipmentPerson;

  to: MelhorEnvioShipmentPerson;

  products: MelhorEnvioShipmentProduct[];

  volumes: MelhorEnvioShipmentVolume[];

  options: {
    platform?: string;
    reminder?: string;

    insurance_value: number;

    receipt: boolean;
    own_hand: boolean;
    reverse: boolean;

    tags?: MelhorEnvioShipmentTag[];
  };
};

type MelhorEnvioCartResponse = {
  id?: string | number;

  [key: string]: unknown;
};

export type CreateMelhorEnvioCartItemResult = {
  providerShipmentId: string;

  response: MelhorEnvioCartResponse;
};

function getConfig() {
  const baseUrl = process.env.MELHOR_ENVIO_BASE_URL;

  const userAgent = process.env.MELHOR_ENVIO_USER_AGENT;

  if (!baseUrl || !userAgent) {
    throw new Error("Configuração do Melhor Envio incompleta.");
  }

  let parsedBaseUrl: URL;

  try {
    parsedBaseUrl = new URL(baseUrl);
  } catch {
    throw new Error("A URL base do Melhor Envio é inválida.");
  }

  /*
   * Nesta etapa do projeto ainda estamos
   * homologando a criação de envios.
   *
   * Não permitimos que esta função seja
   * executada contra a API de produção.
   *
   * Quando o fluxo fiscal definitivo da
   * loja estiver pronto, esta trava será
   * revisada conscientemente.
   */
  if (parsedBaseUrl.hostname !== "sandbox.melhorenvio.com.br") {
    throw new Error(
      "A criação de envios está liberada apenas no Sandbox do Melhor Envio.",
    );
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    userAgent,
  };
}

async function requestCreateCartItem(
  accessToken: string,
  payload: CreateMelhorEnvioCartItemPayload,
) {
  const { baseUrl, userAgent } = getConfig();

  return fetch(`${baseUrl}/api/v2/me/cart`, {
    method: "POST",

    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": userAgent,
    },

    body: JSON.stringify(payload),

    cache: "no-store",
  });
}

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text.slice(0, 500),
    };
  }
}

function getProviderErrorMessage(data: unknown) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message.trim();
  }

  if (typeof record.error === "string" && record.error.trim()) {
    return record.error.trim();
  }

  return null;
}

function validatePayload(payload: CreateMelhorEnvioCartItemPayload) {
  if (!Number.isInteger(payload.service) || payload.service <= 0) {
    throw new Error("Serviço de frete inválido.");
  }

  if (!payload.from || !payload.to) {
    throw new Error("Remetente ou destinatário inválido.");
  }

  if (!Array.isArray(payload.products) || payload.products.length === 0) {
    throw new Error("O envio precisa possuir pelo menos um produto.");
  }

  if (!Array.isArray(payload.volumes) || payload.volumes.length === 0) {
    throw new Error("O envio precisa possuir pelo menos um volume.");
  }

  const invalidProduct = payload.products.find((product) => {
    return (
      !product.name?.trim() ||
      !Number.isInteger(product.quantity) ||
      product.quantity <= 0 ||
      !Number.isFinite(product.unitary_value) ||
      product.unitary_value <= 0
    );
  });

  if (invalidProduct) {
    throw new Error("O envio possui dados de produto inválidos.");
  }

  const invalidVolume = payload.volumes.find((volume) => {
    return (
      !Number.isFinite(volume.height) ||
      volume.height <= 0 ||
      !Number.isFinite(volume.width) ||
      volume.width <= 0 ||
      !Number.isFinite(volume.length) ||
      volume.length <= 0 ||
      !Number.isFinite(volume.weight) ||
      volume.weight <= 0
    );
  });

  if (invalidVolume) {
    throw new Error("O envio possui peso ou dimensões inválidos.");
  }

  if (
    !Number.isFinite(payload.options.insurance_value) ||
    payload.options.insurance_value < 0
  ) {
    throw new Error("O valor segurado do envio é inválido.");
  }
}

/**
 * Insere um envio no carrinho do Melhor Envio.
 *
 * IMPORTANTE:
 * esta função está deliberadamente limitada
 * ao ambiente Sandbox durante a homologação.
 *
 * Ela:
 * - valida o payload;
 * - obtém um access token válido;
 * - envia o POST /api/v2/me/cart;
 * - renova o token uma vez em 401/403;
 * - exige resposta de sucesso;
 * - valida e retorna o ID do envio.
 *
 * Nenhuma informação é salva no banco aqui.
 * A persistência pertence à camada que
 * coordena o pedido da Beecah.
 */
export async function createMelhorEnvioSandboxCartItem(
  payload: CreateMelhorEnvioCartItemPayload,
): Promise<CreateMelhorEnvioCartItemResult> {
  validatePayload(payload);

  /*
   * Executamos getConfig antes de buscar
   * o token para garantir que uma chamada
   * de produção seja bloqueada imediatamente.
   */
  getConfig();

  let accessToken = await getMelhorEnvioAccessToken();

  let response = await requestCreateCartItem(accessToken, payload);

  /*
   * Mesmo comportamento usado atualmente
   * pela cotação:
   *
   * se o token for recusado, força refresh
   * e tenta exatamente mais uma vez.
   */
  if (response.status === 401 || response.status === 403) {
    accessToken = await getMelhorEnvioAccessToken(true);

    response = await requestCreateCartItem(accessToken, payload);
  }

  const responseData = await readResponse(response);

  if (!response.ok) {
    const providerMessage = getProviderErrorMessage(responseData);

    /*
     * Não registramos o payload porque ele
     * contém CPF, endereço, telefone e e-mail.
     */
    console.error("Erro do Melhor Envio ao inserir envio no carrinho:", {
      status: response.status,
      message: providerMessage,
    });

    throw new Error(
      providerMessage
        ? `Melhor Envio: ${providerMessage}`
        : "Não foi possível inserir o envio no carrinho do Melhor Envio.",
    );
  }

  if (!responseData || typeof responseData !== "object") {
    throw new Error("O Melhor Envio retornou uma resposta inválida.");
  }

  const cartResponse = responseData as MelhorEnvioCartResponse;

  const providerShipmentId = String(cartResponse.id ?? "").trim();

  if (!providerShipmentId) {
    console.error(
      "Melhor Envio criou o envio, mas não retornou um ID utilizável.",
      {
        status: response.status,
      },
    );

    throw new Error(
      "O Melhor Envio não retornou o identificador do envio criado.",
    );
  }

  return {
    providerShipmentId,
    response: cartResponse,
  };
}