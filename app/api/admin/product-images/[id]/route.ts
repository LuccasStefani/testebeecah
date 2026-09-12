import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import {
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
  r2,
} from "@/src/lib/r2/client";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function getR2ObjectKey(imageUrl: string) {
  const publicUrl = new URL(R2_PUBLIC_URL);
  const fileUrl = new URL(imageUrl);

  if (fileUrl.hostname !== publicUrl.hostname) {
    throw new Error(
      "A imagem não pertence ao domínio R2 configurado."
    );
  }

  return decodeURIComponent(
    fileUrl.pathname.replace(/^\/+/, "")
  );
}

export async function DELETE(
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
        image_url,
        position,
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

    let nextCoverId: string | null = null;

    if (image.is_cover) {
      const {
        data: nextImage,
        error: nextImageError,
      } = await supabaseAdmin
        .from("product_images")
        .select("id")
        .eq(
          "product_id",
          image.product_id
        )
        .neq("id", image.id)
        .order("position", {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

      if (nextImageError) {
        console.error(
          "Erro ao procurar nova capa:",
          nextImageError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Não foi possível preparar a exclusão da imagem.",
          },
          { status: 500 }
        );
      }

      nextCoverId =
        nextImage?.id ?? null;
    }

    const {
      error: deleteDbError,
    } = await supabaseAdmin
      .from("product_images")
      .delete()
      .eq("id", image.id);

    if (deleteDbError) {
      console.error(
        "Erro ao excluir imagem do banco:",
        deleteDbError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível excluir a imagem.",
        },
        { status: 500 }
      );
    }

    if (nextCoverId) {
      const {
        error: coverError,
      } = await supabaseAdmin
        .from("product_images")
        .update({
          is_cover: true,
        })
        .eq("id", nextCoverId);

      if (coverError) {
        console.error(
          "Erro ao definir nova capa:",
          coverError
        );
      }
    }

    try {
      const objectKey = getR2ObjectKey(
        image.image_url
      );

      await r2.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: objectKey,
        })
      );
    } catch (r2Error) {
      console.error(
        "A imagem foi removida do banco, mas não foi possível apagar o arquivo do R2:",
        r2Error
      );

      return NextResponse.json({
        success: true,
        warning:
          "A imagem foi removida da loja, mas o arquivo pode ter permanecido no R2.",
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Imagem excluída com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao excluir imagem:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erro interno ao excluir a imagem.",
      },
      { status: 500 }
    );
  }
}