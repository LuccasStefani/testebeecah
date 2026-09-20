import { NextResponse } from "next/server";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseOptionalPositiveNumber(
  value: unknown
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    return null;
  }

  return parsed;
}

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

      weight,
      width,
      height,
      length,
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

    const parsedWeight =
      parseOptionalPositiveNumber(weight);

    const parsedWidth =
      parseOptionalPositiveNumber(width);

    const parsedHeight =
      parseOptionalPositiveNumber(height);

    const parsedLength =
      parseOptionalPositiveNumber(length);

    const shippingValues = [
      weight,
      width,
      height,
      length,
    ];

    const hasAnyShippingValue =
      shippingValues.some(
        (value) =>
          value !== undefined &&
          value !== null &&
          value !== ""
      );

    const hasAllValidShippingValues =
      parsedWeight !== null &&
      parsedWidth !== null &&
      parsedHeight !== null &&
      parsedLength !== null;

    if (
      hasAnyShippingValue &&
      !hasAllValidShippingValues
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Para configurar o frete, informe peso, largura, altura e comprimento com valores maiores que zero.",
        },
        { status: 400 }
      );
    }

    const slug = createSlug(name);

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível gerar o slug do produto.",
        },
        { status: 400 }
      );
    }

    const {
      data: existingProduct,
    } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Já existe um produto com esse nome.",
        },
        { status: 409 }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("products")
        .insert({
          name: name.trim(),
          slug,
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

          weight: parsedWeight,
          width: parsedWidth,
          height: parsedHeight,
          length: parsedLength,

          featured:
            featured === true,

          active:
            active !== false,
        })
        .select()
        .single();

    if (error) {
      console.error(
        "Erro ao cadastrar produto:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível cadastrar o produto.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Produto cadastrado com sucesso.",
        product: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Erro na criação do produto:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erro interno ao cadastrar produto.",
      },
      { status: 500 }
    );
  }
}