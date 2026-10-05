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
export type PurchaseMelhorEnvioSandboxShipmentResult = {
  providerShipmentId: string;
  response: unknown;
};

async function requestCheckoutShipment(
  accessToken: string,
  providerShipmentId: string,
) {
  const { baseUrl, userAgent } = getConfig();

  return fetch(
    `${baseUrl}/api/v2/me/shipment/checkout`,
    {
      method: "POST",

      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": userAgent,
      },

      body: JSON.stringify({
        orders: [
          providerShipmentId,
        ],
      }),

      cache: "no-store",
    },
  );
}

/**
 * Compra um envio que já está no carrinho
 * do Melhor Envio Sandbox.
 *
 * IMPORTANTE:
 * - aceita somente Sandbox;
 * - não altera o banco;
 * - não faz retry genérico;
 * - só repete a chamada quando o provedor
 *   responde explicitamente 401/403, após
 *   refresh do token OAuth.
 */
export async function purchaseMelhorEnvioSandboxShipment(
  providerShipmentId: string,
): Promise<PurchaseMelhorEnvioSandboxShipmentResult> {
  const normalizedProviderShipmentId =
    String(providerShipmentId ?? "").trim();

  if (!normalizedProviderShipmentId) {
    throw new Error(
      "O identificador do envio do Melhor Envio é obrigatório.",
    );
  }

  /*
   * Mantém a trava que impede chamadas
   * acidentais ao ambiente de produção.
   */
  getConfig();

  let accessToken =
    await getMelhorEnvioAccessToken();

  let response =
    await requestCheckoutShipment(
      accessToken,
      normalizedProviderShipmentId,
    );

  if (
    response.status === 401 ||
    response.status === 403
  ) {
    accessToken =
      await getMelhorEnvioAccessToken(true);

    response =
      await requestCheckoutShipment(
        accessToken,
        normalizedProviderShipmentId,
      );
  }

  const responseData =
    await readResponse(response);

  if (!response.ok) {
    const providerMessage =
      getProviderErrorMessage(responseData);

    console.error(
      "Erro do Melhor Envio ao comprar envio:",
      {
        status: response.status,
        message: providerMessage,
      },
    );

    throw new Error(
      providerMessage
        ? `Melhor Envio: ${providerMessage}`
        : "Não foi possível comprar o envio no Melhor Envio.",
    );
  }

  return {
    providerShipmentId:
      normalizedProviderShipmentId,

    response:
      responseData,
  };
}
export type RequestMelhorEnvioSandboxLabelGenerationResult = {
  providerShipmentId: string;
  response: unknown;
};

async function requestGenerateShipment(
  accessToken: string,
  providerShipmentId: string,
) {
  const { baseUrl, userAgent } = getConfig();

  return fetch(
    `${baseUrl}/api/v2/me/shipment/generate`,
    {
      method: "POST",

      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": userAgent,
      },

      body: JSON.stringify({
        orders: [
          providerShipmentId,
        ],
      }),

      cache: "no-store",
    },
  );
}

/**
 * Solicita a geração de uma etiqueta
 * já comprada no Melhor Envio Sandbox.
 *
 * IMPORTANTE:
 *
 * Uma resposta HTTP de sucesso significa
 * que a solicitação de geração foi aceita.
 *
 * Isso NÃO significa necessariamente que
 * a etiqueta já terminou de ser gerada.
 *
 * A confirmação será feita posteriormente
 * consultando o estado do envio no provedor.
 */
export async function requestMelhorEnvioSandboxLabelGeneration(
  providerShipmentId: string,
): Promise<RequestMelhorEnvioSandboxLabelGenerationResult> {
  const normalizedProviderShipmentId =
    String(providerShipmentId ?? "").trim();

  if (!normalizedProviderShipmentId) {
    throw new Error(
      "O identificador do envio do Melhor Envio é obrigatório.",
    );
  }

  /*
   * Mantém a trava que impede chamadas
   * acidentais ao ambiente de produção.
   */
  getConfig();

  let accessToken =
    await getMelhorEnvioAccessToken();

  let response =
    await requestGenerateShipment(
      accessToken,
      normalizedProviderShipmentId,
    );

  /*
   * Mantém o mesmo comportamento dos
   * outros endpoints autenticados:
   *
   * caso o token seja recusado, força
   * refresh e tenta exatamente mais
   * uma vez.
   */
  if (
    response.status === 401 ||
    response.status === 403
  ) {
    accessToken =
      await getMelhorEnvioAccessToken(true);

    response =
      await requestGenerateShipment(
        accessToken,
        normalizedProviderShipmentId,
      );
  }

  const responseData =
    await readResponse(response);

  if (!response.ok) {
    const providerMessage =
      getProviderErrorMessage(responseData);

    console.error(
      "Erro do Melhor Envio ao solicitar geração da etiqueta:",
      {
        status: response.status,
        message: providerMessage,
      },
    );

    throw new Error(
      providerMessage
        ? `Melhor Envio: ${providerMessage}`
        : "Não foi possível solicitar a geração da etiqueta.",
    );
  }

  /*
   * Não interpretamos o HTTP 200 como
   * "etiqueta gerada".
   *
   * Aqui apenas confirmamos que o provedor
   * aceitou a solicitação.
   */
  return {
    providerShipmentId:
      normalizedProviderShipmentId,

    response:
      responseData,
  };
}

export type GetMelhorEnvioSandboxShipmentResult = {
  providerShipmentId: string;
  response: unknown;
};

async function requestShipmentDetails(
  accessToken: string,
  providerShipmentId: string,
) {
  const { baseUrl, userAgent } = getConfig();

  return fetch(
    `${baseUrl}/api/v2/me/orders/${encodeURIComponent(
      providerShipmentId,
    )}`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": userAgent,
      },

      cache: "no-store",
    },
  );
}

/**
 * Consulta uma etiqueta específica
 * no Melhor Envio Sandbox.
 *
 * Esta função apenas lê o estado remoto.
 * Nenhuma informação é alterada no
 * Melhor Envio ou no banco da Beecah.
 */
export async function getMelhorEnvioSandboxShipment(
  providerShipmentId: string,
): Promise<GetMelhorEnvioSandboxShipmentResult> {
  const normalizedProviderShipmentId =
    String(providerShipmentId ?? "").trim();

  if (!normalizedProviderShipmentId) {
    throw new Error(
      "O identificador do envio do Melhor Envio é obrigatório.",
    );
  }

  /*
   * Mantém a proteção que bloqueia
   * chamadas acidentais em produção.
   */
  getConfig();

  let accessToken =
    await getMelhorEnvioAccessToken();

  let response =
    await requestShipmentDetails(
      accessToken,
      normalizedProviderShipmentId,
    );

  if (
    response.status === 401 ||
    response.status === 403
  ) {
    accessToken =
      await getMelhorEnvioAccessToken(true);

    response =
      await requestShipmentDetails(
        accessToken,
        normalizedProviderShipmentId,
      );
  }

  const responseData =
    await readResponse(response);

  if (!response.ok) {
    const providerMessage =
      getProviderErrorMessage(responseData);

    console.error(
      "Erro do Melhor Envio ao consultar etiqueta:",
      {
        status: response.status,
        message: providerMessage,
      },
    );

    throw new Error(
      providerMessage
        ? `Melhor Envio: ${providerMessage}`
        : "Não foi possível consultar a etiqueta no Melhor Envio.",
    );
  }

  if (
    !responseData ||
    typeof responseData !== "object"
  ) {
    throw new Error(
      "O Melhor Envio retornou uma resposta inválida ao consultar a etiqueta.",
    );
  }

  return {
    providerShipmentId:
      normalizedProviderShipmentId,

    response:
      responseData,
  };
}

export type PrintMelhorEnvioSandboxShipmentResult = {
  providerShipmentId: string;
  url: string;
  response: unknown;
};

async function requestShipmentPrint(
  accessToken: string,
  providerShipmentId: string,
) {
  const { baseUrl, userAgent } = getConfig();

  return fetch(
    `${baseUrl}/api/v2/me/shipment/print`,
    {
      method: "POST",

      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": userAgent,
      },

      body: JSON.stringify({
        mode: "public",
        orders: [
          providerShipmentId,
        ],
      }),

      cache: "no-store",
    },
  );
}

function extractPrintUrl(
  responseData: unknown,
) {
  if (
    !responseData ||
    typeof responseData !== "object" ||
    Array.isArray(responseData)
  ) {
    return null;
  }

  const data =
    responseData as Record<string, unknown>;

  const possibleKeys = [
    "url",
    "link",
  ];

  for (const key of possibleKeys) {
    const value = data[key];

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return null;
}

/**
 * Solicita ao Melhor Envio Sandbox
 * um link público de impressão para
 * uma etiqueta já gerada.
 *
 * Esta função NÃO:
 * - compra frete;
 * - gera etiqueta;
 * - altera o banco;
 * - imprime automaticamente.
 *
 * Ela apenas solicita o link de
 * impressão ao provedor.
 */
export async function printMelhorEnvioSandboxShipment(
  providerShipmentId: string,
): Promise<PrintMelhorEnvioSandboxShipmentResult> {
  const normalizedProviderShipmentId =
    String(
      providerShipmentId ?? "",
    ).trim();

  if (!normalizedProviderShipmentId) {
    throw new Error(
      "O identificador do envio do Melhor Envio é obrigatório.",
    );
  }

  /*
   * Mantém a proteção atual que impede
   * chamadas acidentais fora do Sandbox.
   */
  getConfig();

  let accessToken =
    await getMelhorEnvioAccessToken();

  let response =
    await requestShipmentPrint(
      accessToken,
      normalizedProviderShipmentId,
    );

  /*
   * Mesmo padrão dos demais helpers:
   * se o token for recusado, atualizamos
   * uma única vez e repetimos a chamada.
   */
  if (
    response.status === 401 ||
    response.status === 403
  ) {
    accessToken =
      await getMelhorEnvioAccessToken(true);

    response =
      await requestShipmentPrint(
        accessToken,
        normalizedProviderShipmentId,
      );
  }

  const responseData =
    await readResponse(response);

  if (!response.ok) {
    const providerMessage =
      getProviderErrorMessage(
        responseData,
      );

    console.error(
      "Erro do Melhor Envio ao solicitar impressão da etiqueta:",
      {
        status: response.status,
        message: providerMessage,
      },
    );

    throw new Error(
      providerMessage
        ? `Melhor Envio: ${providerMessage}`
        : "Não foi possível solicitar a impressão da etiqueta.",
    );
  }

  const url =
    extractPrintUrl(responseData);

  if (!url) {
    throw new Error(
      "O Melhor Envio aceitou a solicitação de impressão, mas não retornou um link válido.",
    );
  }

  /*
   * Permitimos somente URLs HTTP/HTTPS
   * antes de repassar o link para a
   * camada administrativa.
   */
  let parsedUrl: URL;

  try {
    parsedUrl =
      new URL(url);
  } catch {
    throw new Error(
      "O Melhor Envio retornou um link de impressão inválido.",
    );
  }

  if (
    parsedUrl.protocol !== "https:" &&
    parsedUrl.protocol !== "http:"
  ) {
    throw new Error(
      "O Melhor Envio retornou um protocolo de impressão inválido.",
    );
  }

  return {
    providerShipmentId:
      normalizedProviderShipmentId,

    url:
      parsedUrl.toString(),

    response:
      responseData,
  };
}

export type TrackMelhorEnvioSandboxShipmentResult = {
  providerShipmentId: string;
  response: unknown;
};

async function requestShipmentTracking(
  accessToken: string,
  providerShipmentId: string,
) {
  const { baseUrl, userAgent } = getConfig();

  return fetch(
    `${baseUrl}/api/v2/me/shipment/tracking`,
    {
      method: "POST",

      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": userAgent,
      },

      body: JSON.stringify({
        orders: [
          providerShipmentId,
        ],
      }),

      cache: "no-store",
    },
  );
}

/**
 * Consulta o rastreamento/status da
 * etiqueta no Melhor Envio Sandbox.
 *
 * Esta função é somente leitura.
 *
 * Ela NÃO:
 * - compra frete;
 * - gera etiqueta;
 * - imprime etiqueta;
 * - altera nosso banco.
 */
export async function trackMelhorEnvioSandboxShipment(
  providerShipmentId: string,
): Promise<TrackMelhorEnvioSandboxShipmentResult> {
  const normalizedProviderShipmentId =
    String(
      providerShipmentId ?? "",
    ).trim();

  if (!normalizedProviderShipmentId) {
    throw new Error(
      "O identificador do envio do Melhor Envio é obrigatório.",
    );
  }

  /*
   * Mantém a proteção que bloqueia
   * chamadas acidentais fora do Sandbox.
   */
  getConfig();

  let accessToken =
    await getMelhorEnvioAccessToken();

  let response =
    await requestShipmentTracking(
      accessToken,
      normalizedProviderShipmentId,
    );

  /*
   * Se o token for recusado,
   * força refresh e tenta exatamente
   * mais uma vez.
   */
  if (
    response.status === 401 ||
    response.status === 403
  ) {
    accessToken =
      await getMelhorEnvioAccessToken(true);

    response =
      await requestShipmentTracking(
        accessToken,
        normalizedProviderShipmentId,
      );
  }

  const responseData =
    await readResponse(response);

  if (!response.ok) {
    const providerMessage =
      getProviderErrorMessage(
        responseData,
      );

    console.error(
      "Erro do Melhor Envio ao consultar rastreamento:",
      {
        status: response.status,
        message: providerMessage,
      },
    );

    throw new Error(
      providerMessage
        ? `Melhor Envio: ${providerMessage}`
        : "Não foi possível consultar o rastreamento no Melhor Envio.",
    );
  }

  if (
    !responseData ||
    typeof responseData !== "object"
  ) {
    throw new Error(
      "O Melhor Envio retornou uma resposta inválida ao consultar o rastreamento.",
    );
  }

  return {
    providerShipmentId:
      normalizedProviderShipmentId,

    response:
      responseData,
  };
}