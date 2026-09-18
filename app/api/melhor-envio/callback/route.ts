import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/src/lib/supabase/admin";

type MelhorEnvioTokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
  scope?: string;
};

export async function GET(request: NextRequest) {
  const clientId =
    process.env.MELHOR_ENVIO_CLIENT_ID;

  const clientSecret =
    process.env.MELHOR_ENVIO_CLIENT_SECRET;

  const redirectUri =
    process.env.MELHOR_ENVIO_REDIRECT_URI;

  const baseUrl =
    process.env.MELHOR_ENVIO_BASE_URL;

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri ||
    !baseUrl
  ) {
    return NextResponse.json(
      {
        error:
          "Configuração do Melhor Envio incompleta.",
      },
      {
        status: 500,
      }
    );
  }

  const code =
    request.nextUrl.searchParams.get("code");

  const returnedState =
    request.nextUrl.searchParams.get("state");

  const savedState =
    request.cookies.get(
      "melhor_envio_oauth_state"
    )?.value;

  if (!code) {
    return NextResponse.json(
      {
        error:
          "Código de autorização não recebido.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !returnedState ||
    !savedState ||
    returnedState !== savedState
  ) {
    return NextResponse.json(
      {
        error:
          "Estado OAuth inválido ou expirado.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const tokenResponse = await fetch(
      `${baseUrl}/oauth/token`,
      {
        method: "POST",

        headers: {
          Accept: "application/json",
          "Content-Type":
            "application/json",
          "User-Agent":
            "Beecah (testebeecah.vercel.app)",
        },

        body: JSON.stringify({
          grant_type:
            "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
        }),

        cache: "no-store",
      }
    );

    const tokenData =
      (await tokenResponse.json()) as
        | MelhorEnvioTokenResponse
        | {
            message?: string;
            error?: string;
          };

    if (!tokenResponse.ok) {
      console.error(
        "Erro OAuth Melhor Envio:",
        tokenData
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível obter o token do Melhor Envio.",
        },
        {
          status: 502,
        }
      );
    }

    const tokens =
      tokenData as MelhorEnvioTokenResponse;

    if (
      !tokens.access_token ||
      !tokens.refresh_token ||
      !tokens.expires_in
    ) {
      return NextResponse.json(
        {
          error:
            "Resposta de token inválida do Melhor Envio.",
        },
        {
          status: 502,
        }
      );
    }

    const expiresAt = new Date(
      Date.now() +
        tokens.expires_in * 1000
    ).toISOString();

    const {
      error: saveError,
    } = await supabaseAdmin
      .from("integration_tokens")
      .upsert(
        {
          provider: "melhor_envio",
          access_token:
            tokens.access_token,
          refresh_token:
            tokens.refresh_token,
          token_type:
            tokens.token_type,
          scope:
            tokens.scope ?? null,
          expires_at: expiresAt,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "provider",
        }
      );

    if (saveError) {
      console.error(
        "Erro ao salvar token do Melhor Envio:",
        saveError
      );

      return NextResponse.json(
        {
          error:
            "Autorização recebida, mas não foi possível salvar a integração.",
        },
        {
          status: 500,
        }
      );
    }

    const response =
      NextResponse.redirect(
        new URL(
          "/admin?melhor-envio=connected",
          request.url
        )
      );

    response.cookies.delete(
      "melhor_envio_oauth_state"
    );

    return response;
  } catch (error) {
    console.error(
      "Erro na autorização do Melhor Envio:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao conectar com o Melhor Envio.",
      },
      {
        status: 500,
      }
    );
  }
}