import { NextResponse } from "next/server";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  _request: Request,
  { params }: RouteProps
) {
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

    const { id } = await params;

    const {
      data: image,
      error: imageError,
    } = await supabaseAdmin
      .from("product_images")
      .select(`
        id,
        product_id,
        is_cover
      `)
      .eq("id", id)
      .single();

    if (imageError || !image) {
      return NextResponse.json(
        {
          success: false,
          message: "Imagem não encontrada.",
        },
        { status: 404 }
      );
    }

    if (image.is_cover) {
      return NextResponse.json({
        success: true,
        message:
          "Esta imagem já é a capa do produto.",
      });
    }

    const {
      error: removeCoverError,
    } = await supabaseAdmin
      .from("product_images")
      .update({
        is_cover: false,
      })
      .eq(
        "product_id",
        image.product_id
      )
      .eq("is_cover", true);

    if (removeCoverError) {
      console.error(
        "Erro ao remover capa atual:",
        removeCoverError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível alterar a capa.",
        },
        { status: 500 }
      );
    }

    const {
      data: updatedImage,
      error: updateError,
    } = await supabaseAdmin
      .from("product_images")
      .update({
        is_cover: true,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error(
        "Erro ao definir nova capa:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível definir a nova capa.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Imagem principal alterada com sucesso.",
      image: updatedImage,
    });
  } catch (error) {
    console.error(
      "Erro ao alterar capa:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erro interno ao alterar a capa.",
      },
      { status: 500 }
    );
  }
}