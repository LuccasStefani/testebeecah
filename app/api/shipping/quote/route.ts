import { NextResponse } from "next/server";

import {
  calculateShippingForUser,
} from "@/src/lib/melhor-envio/shipping";

import {
  createSupabaseServerClient,
} from "@/src/lib/supabase/server";

type QuoteRequestBody = {
  addressId?: unknown;
};

export async function POST(
  request: Request
) {
  try {
    /*
     * 1. Identifica o usuário autenticado.
     */
    const supabase =
      await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Você precisa estar logado para calcular o frete.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * 2. O navegador informa somente
     * o ID do endereço escolhido.
     */
    const body =
      (await request.json()) as
        QuoteRequestBody;

    const addressId =
      typeof body.addressId === "string"
        ? body.addressId.trim()
        : "";

    if (!addressId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selecione um endereço de entrega.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 3. Toda a validação e o cálculo
     * ficam centralizados no helper.
     */
    const result =
      await calculateShippingForUser(
        user.id,
        addressId
      );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "Erro ao calcular frete:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Erro interno ao calcular frete.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 500,
      }
    );
  }
}