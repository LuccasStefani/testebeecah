import { NextResponse } from "next/server";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .select(`
        id,
        name
      `)
      .eq("active", true)
      .order("name", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Erro ao buscar produtos:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível carregar os produtos.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      products: data ?? [],
    });
  } catch (error) {
    console.error(
      "Erro na rota products-simple:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erro interno ao carregar produtos.",
      },
      { status: 500 }
    );
  }
}