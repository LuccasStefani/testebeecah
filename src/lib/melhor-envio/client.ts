import "server-only";

import { supabaseAdmin } from "@/src/lib/supabase/admin";

type IntegrationToken = {
  access_token: string;
  refresh_token: string;
  token_type: string | null;
  scope: string | null;
  expires_at: string;
};

type MelhorEnvioTokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
  scope?: string;
};

const TOKEN_EXPIRATION_MARGIN_MS =
  5 * 60 * 1000;

function getConfig() {
  const clientId =
    process.env.MELHOR_ENVIO_CLIENT_ID;

  const clientSecret =
    process.env.MELHOR_ENVIO_CLIENT_SECRET;

  const redirectUri =
    process.env.MELHOR_ENVIO_REDIRECT_URI;

  const baseUrl =
    process.env.MELHOR_ENVIO_BASE_URL;

  const userAgent =
    process.env.MELHOR_ENVIO_USER_AGENT;

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri ||
    !baseUrl ||
    !userAgent
  ) {
    throw new Error(
      "Configuração do Melhor Envio incompleta."
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    baseUrl,
    userAgent,
  };
}

async function loadStoredToken() {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("integration_tokens")
    .select(`
      access_token,
      refresh_token,
      token_type,
      scope,
      expires_at
    `)
    .eq("provider", "melhor_envio")
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao carregar token do Melhor Envio:",
      error
    );

    throw new Error(
      "Não foi possível carregar a integração com o Melhor Envio."
    );
  }

  if (!data) {
    throw new Error(
      "Melhor Envio ainda não foi conectado."
    );
  }

  return data as IntegrationToken;
}

function tokenIsStillValid(
  token: IntegrationToken
) {
  const expiresAt =
    new Date(
      token.expires_at
    ).getTime();

  if (!Number.isFinite(expiresAt)) {
    return false;
  }

  return (
    expiresAt -
      TOKEN_EXPIRATION_MARGIN_MS >
    Date.now()
  );
}

async function refreshAccessToken(
  currentToken: IntegrationToken
) {
  const {
    clientId,
    clientSecret,
    redirectUri,
    baseUrl,
    userAgent,
  } = getConfig();

  const response = await fetch(
    `${baseUrl}/oauth/token`,
    {
      method: "POST",

      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/json",
        "User-Agent": userAgent,
      },

      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        refresh_token:
          currentToken.refresh_token,
      }),

      cache: "no-store",
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    console.error(
      "Erro ao renovar token do Melhor Envio:",
      data
    );

    throw new Error(
      "Não foi possível renovar a autorização do Melhor Envio. Pode ser necessário conectar a conta novamente."
    );
  }

  const tokenData =
    data as MelhorEnvioTokenResponse;

  if (
    !tokenData.access_token ||
    !tokenData.refresh_token ||
    !tokenData.expires_in
  ) {
    throw new Error(
      "O Melhor Envio retornou uma resposta de token inválida."
    );
  }

  const expiresAt =
    new Date(
      Date.now() +
        tokenData.expires_in * 1000
    ).toISOString();

  const {
    error: updateError,
  } = await supabaseAdmin
    .from("integration_tokens")
    .update({
      access_token:
        tokenData.access_token,

      refresh_token:
        tokenData.refresh_token,

      token_type:
        tokenData.token_type ??
        currentToken.token_type ??
        "Bearer",

      scope:
        tokenData.scope ??
        currentToken.scope,

      expires_at:
        expiresAt,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "provider",
      "melhor_envio"
    );

  if (updateError) {
    console.error(
      "Erro ao salvar token renovado do Melhor Envio:",
      updateError
    );

    throw new Error(
      "O token do Melhor Envio foi renovado, mas não pôde ser salvo."
    );
  }

  return tokenData.access_token;
}

export async function getMelhorEnvioAccessToken(
  forceRefresh = false
) {
  const token =
    await loadStoredToken();

  if (
    !forceRefresh &&
    tokenIsStillValid(token)
  ) {
    return token.access_token;
  }

  return refreshAccessToken(
    token
  );
}