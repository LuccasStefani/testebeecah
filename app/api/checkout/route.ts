import { Preference } from "mercadopago";
import { NextResponse } from "next/server";

import { mercadoPagoClient } from "@/src/lib/mercadopago/client";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase =
      await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Você precisa estar logado para finalizar a compra.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const items = body?.items;

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Carrinho vazio.",
        },
        { status: 400 }
      );
    }

    const requestedItems = items
      .map((item) => ({
        productId:
          typeof item.productId === "string"
            ? item.productId
            : "",
        quantity: Number(item.quantity),
      }))
      .filter(
        (item) =>
          item.productId &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0
      );

    if (requestedItems.length !== items.length) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Um ou mais itens do carrinho são inválidos.",
        },
        { status: 400 }
      );
    }

    const productIds = requestedItems.map(
      (item) => item.productId
    );

    const {
      data: products,
      error: productsError,
    } = await supabase
      .from("products")
      .select(`
        id,
        name,
        price,
        promo_price,
        stock,
        active
      `)
      .in("id", productIds)
      .eq("active", true);

    if (productsError) {
      console.error(
        "Erro ao carregar produtos para checkout:",
        productsError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível validar os produtos.",
        },
        { status: 500 }
      );
    }

    if (
      !products ||
      products.length !== productIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Um ou mais produtos não estão disponíveis.",
        },
        { status: 400 }
      );
    }

    const preferenceItems = requestedItems.map(
      (requestedItem) => {
        const product = products.find(
          (item) =>
            item.id === requestedItem.productId
        );

        if (!product) {
          throw new Error(
            "Produto do carrinho não encontrado."
          );
        }

        if (
          requestedItem.quantity >
          product.stock
        ) {
          throw new Error(
            `Estoque insuficiente para ${product.name}.`
          );
        }

        const unitPrice =
          product.promo_price !== null
            ? Number(product.promo_price)
            : Number(product.price);

        return {
          id: product.id,
          title: product.name,
          quantity: requestedItem.quantity,
          unit_price: unitPrice,
          currency_id: "BRL",
        };
      }
    );

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      new URL(request.url).origin;

    const preference = new Preference(
      mercadoPagoClient
    );

    const result = await preference.create({
      body: {
        items: preferenceItems,

        payer: {
          email: user.email ?? undefined,
        },

        back_urls: {
          success: `${origin}/checkout/sucesso`,
          failure: `${origin}/checkout/erro`,
          pending: `${origin}/checkout/pendente`,
        },

        auto_return: "approved",

        external_reference: user.id,
      },
    });

    if (!result.id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O Mercado Pago não retornou uma preferência válida.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint:
        result.sandbox_init_point,
    });
  } catch (error) {
    console.error(
      "Erro ao criar checkout:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Erro interno ao criar checkout.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}