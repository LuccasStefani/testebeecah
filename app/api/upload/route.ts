import {
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import {
  r2,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
} from "@/src/lib/r2/client";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

export async function POST(request: Request) {
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

    const formData = await request.formData();

    const file = formData.get("file");
    const productId = formData.get("productId");
    const positionValue = formData.get("position");
    const isCoverValue = formData.get("isCover");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Nenhum arquivo enviado.",
        },
        { status: 400 }
      );
    }

    if (
      typeof productId !== "string" ||
      productId.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "productId é obrigatório.",
        },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Formato não permitido. Use JPG, PNG ou WEBP.",
        },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A imagem deve ter no máximo 10 MB.",
        },
        { status: 400 }
      );
    }

    const parsedPosition =
      typeof positionValue === "string"
        ? Number(positionValue)
        : 0;

    const position =
      Number.isInteger(parsedPosition) &&
      parsedPosition >= 0
        ? parsedPosition
        : 0;

    const isCover =
      isCoverValue === "true";

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ?? "webp";

    const fileName =
      `products/${productId}/${crypto.randomUUID()}.${extension}`;

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
        CacheControl:
          "public, max-age=31536000",
      })
    );

    const imageUrl =
      `${R2_PUBLIC_URL}/${fileName}`;

    if (isCover) {
      const {
        error: removeOldCoverError,
      } = await supabaseAdmin
        .from("product_images")
        .update({
          is_cover: false,
        })
        .eq("product_id", productId)
        .eq("is_cover", true);

      if (removeOldCoverError) {
        console.error(
          "Erro ao remover capa antiga:",
          removeOldCoverError
        );

        await r2.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileName,
          })
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Não foi possível atualizar a imagem principal.",
          },
          { status: 500 }
        );
      }
    }

    const { data, error } =
      await supabaseAdmin
        .from("product_images")
        .insert({
          product_id: productId,
          image_url: imageUrl,
          position,
          is_cover: isCover,
        })
        .select()
        .single();

    if (error) {
      console.error(
        "Erro ao salvar imagem no Supabase:",
        error
      );

      await r2.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileName,
        })
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível salvar a imagem no Supabase.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Imagem enviada e vinculada ao produto com sucesso.",
      image: data,
      imageUrl,
      fileName,
    });
  } catch (error) {
    console.error(
      "Erro ao enviar imagem:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erro ao enviar e salvar a imagem.",
      },
      { status: 500 }
    );
  }
}