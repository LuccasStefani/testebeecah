import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import {
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
  r2,
} from "@/src/lib/r2/client";
import { requireAdmin } from "@/src/lib/auth/require-admin";
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

export async function PATCH(
  request: Request,
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

    const body = await request.json();

    const {
      name,
      brand,
      description,
      price,
      promoPrice,
      stock,
      category,
      volume,
      fragranceFamily,
      topNotes,
      heartNotes,
      baseNotes,
      featured,
      active,
    } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof brand !== "string" ||
      !brand.trim() ||
      typeof category !== "string" ||
      !category.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Nome, marca e categoria são obrigatórios.",
        },
        { status: 400 }
      );
    }

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Preço inválido.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(parsedStock) ||
      parsedStock < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Estoque inválido.",
        },
        { status: 400 }
      );
    }

    let parsedPromoPrice: number | null =
      null;

    if (
      promoPrice !== undefined &&
      promoPrice !== null &&
      promoPrice !== ""
    ) {
      parsedPromoPrice =
        Number(promoPrice);

      if (
        !Number.isFinite(
          parsedPromoPrice
        ) ||
        parsedPromoPrice < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Preço promocional inválido.",
          },
          { status: 400 }
        );
      }
    }

    const { data, error } =
      await supabaseAdmin
        .from("products")
        .update({
          name: name.trim(),
          brand: brand.trim(),

          description:
            typeof description ===
            "string"
              ? description.trim()
              : "",

          price: parsedPrice,
          promo_price:
            parsedPromoPrice,
          stock: parsedStock,

          category:
            category.trim(),

          volume:
            typeof volume ===
              "string" &&
            volume.trim()
              ? volume.trim()
              : null,

          fragrance_family:
            typeof fragranceFamily ===
              "string" &&
            fragranceFamily.trim()
              ? fragranceFamily.trim()
              : null,

          top_notes:
            Array.isArray(topNotes)
              ? topNotes
              : [],

          heart_notes:
            Array.isArray(heartNotes)
              ? heartNotes
              : [],

          base_notes:
            Array.isArray(baseNotes)
              ? baseNotes
              : [],

          featured:
            featured === true,

          active:
            active === true,

          updated_at:
            new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
      console.error(
        "Erro ao atualizar produto:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível atualizar o produto.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Produto atualizado com sucesso.",
      product: data,
    });
  } catch (error) {
    console.error(
      "Erro na edição do produto:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erro interno ao atualizar produto.",
      },
      { status: 500 }
    );
  }
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
      data: product,
      error: productError,
    } = await supabaseAdmin
      .from("products")
      .select(`
        id,
        name,
        product_images (
          id,
          image_url
        )
      `)
      .eq("id", id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Produto não encontrado.",
        },
        { status: 404 }
      );
    }

    const images =
      product.product_images ?? [];

    const {
      error: deleteProductError,
    } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", id);

    if (deleteProductError) {
      console.error(
        "Erro ao excluir produto:",
        deleteProductError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível excluir o produto.",
        },
        { status: 500 }
      );
    }

    const failedR2Deletes: string[] =
      [];

    for (const image of images) {
      try {
        const objectKey =
          getR2ObjectKey(
            image.image_url
          );

        await r2.send(
          new DeleteObjectCommand({
            Bucket:
              R2_BUCKET_NAME,
            Key: objectKey,
          })
        );
      } catch (r2Error) {
        console.error(
          `Erro ao excluir imagem ${image.id} do R2:`,
          r2Error
        );

        failedR2Deletes.push(
          image.image_url
        );
      }
    }

    if (
      failedR2Deletes.length > 0
    ) {
      return NextResponse.json({
        success: true,
        warning:
          "O produto foi excluído da loja, mas um ou mais arquivos de imagem podem ter permanecido no R2.",
        failedImages:
          failedR2Deletes.length,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Produto e imagens excluídos com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro na exclusão do produto:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erro interno ao excluir produto.",
      },
      { status: 500 }
    );
  }
}