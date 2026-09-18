import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function GET() {
  const clientId = process.env.MELHOR_ENVIO_CLIENT_ID;
  const redirectUri = process.env.MELHOR_ENVIO_REDIRECT_URI;
  const baseUrl = process.env.MELHOR_ENVIO_BASE_URL;

  if (!clientId || !redirectUri || !baseUrl) {
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

  const state = randomBytes(32).toString("hex");

  const authorizationUrl = new URL(
    "/oauth/authorize",
    baseUrl
  );

  authorizationUrl.searchParams.set(
    "client_id",
    clientId
  );

  authorizationUrl.searchParams.set(
    "redirect_uri",
    redirectUri
  );

  authorizationUrl.searchParams.set(
    "response_type",
    "code"
  );

  authorizationUrl.searchParams.set(
    "scope",
    [
      "cart-read",
      "cart-write",
      "companies-read",
      "coupons-read",
      "services-read",
      "shipment-calculate",
      "shipment-checkout",
      "shipment-generate",
      "shipment-print",
      "shipment-read",
      "shipping-calculate",
      "tracking-read",
    ].join(" ")
  );

  authorizationUrl.searchParams.set(
    "state",
    state
  );

  const response = NextResponse.redirect(
    authorizationUrl
  );

  response.cookies.set(
    "melhor_envio_oauth_state",
    state,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    }
  );

  return response;
}