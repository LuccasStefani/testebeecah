import { Preference } from "mercadopago";
import { NextResponse } from "next/server";

import { mercadoPagoClient } from "@/src/lib/mercadopago/client";
import { supabaseAdmin } from "@/src/lib/supabase/admin";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type RequestedItem = {
  productId: string;
  quantity: number;
};

export async function POST(request: Request) {
  let createdOrderId: string | null = null;

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

    const requestedItems: RequestedItem[] =
      items
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

    if (
      requestedItems.length !==
      items.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Um ou mais itens do carrinho são inválidos.",
        },
        { status: 400 }
      );
    }

    const productIds =
      requestedItems.map(
        (item) => item.productId
      );

    const {
      data: products,
      error: productsError,
    } = await supabaseAdmin
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
      products.length !==
        productIds.length
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

    const checkoutItems =
      requestedItems.map(
        (requestedItem) => {
          const product =
            products.find(
              (item) =>
                item.id ===
                requestedItem.productId
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
              ? Number(
                  product.promo_price
                )
              : Number(product.price);

          if (
            !Number.isFinite(unitPrice) ||
            unitPrice < 0
          ) {
            throw new Error(
              `Preço inválido para ${product.name}.`
            );
          }

          const subtotal =
            unitPrice *
            requestedItem.quantity;

          return {
            productId: product.id,
            name: product.name,
            unitPrice,
            quantity:
              requestedItem.quantity,
            subtotal,
          };
        }
      );

    const total = checkoutItems.reduce(
      (sum, item) =>
        sum + item.subtotal,
      0
    );

    if (
      !Number.isFinite(total) ||
      total <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O valor total do pedido é inválido.",
        },
        { status: 400 }
      );
    }

    /*
     * 1. Cria o pedido antes de chamar
     *    o Mercado Pago.
     */
    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending",
        total,
      })
      .select(`
        id,
        user_id,
        status,
        total
      `)
      .single();

    if (orderError || !order) {
      console.error(
        "Erro ao criar pedido:",
        orderError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível criar o pedido.",
        },
        { status: 500 }
      );
    }

    createdOrderId = order.id;

    /*
     * 2. Salva uma cópia dos itens,
     *    nome e preço usados na compra.
     */
    const orderItems =
      checkoutItems.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
      }));

    const {
      error: orderItemsError,
    } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (orderItemsError) {
      console.error(
        "Erro ao criar itens do pedido:",
        orderItemsError
      );

      /*
       * O delete do pedido remove
       * order_items por cascade.
       */
      await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", order.id);

      createdOrderId = null;

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível salvar os itens do pedido.",
        },
        { status: 500 }
      );
    }

    /*
     * 3. Monta os itens que serão enviados
     *    para o Mercado Pago.
     */
    const preferenceItems =
      checkoutItems.map((item) => ({
        id: item.productId,
        title: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: "BRL",
      }));

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      new URL(request.url).origin;

    const preference =
      new Preference(
        mercadoPagoClient
      );

    /*
     * O external_reference agora é
     * o ID do pedido, não o user.id.
     *
     * Assim o webhook saberá exatamente
     * qual pedido atualizar.
     */
    const result =
      await preference.create({
        body: {
          items: preferenceItems,

          payer: {
            email:
              user.email ?? undefined,
          },

          back_urls: {
            success:
              `${origin}/checkout/sucesso`,

            failure:
              `${origin}/checkout/erro`,

            pending:
              `${origin}/checkout/pendente`,
          },

          auto_return: "approved",

          external_reference:
            order.id,

          metadata: {
            order_id: order.id,
            user_id: user.id,
          },
        },
      });

    if (!result.id) {
      throw new Error(
        "O Mercado Pago não retornou uma preferência válida."
      );
    }

    /*
     * 4. Salva a preferência no pedido.
     */
    const {
      error: preferenceUpdateError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        mercado_pago_preference_id:
          result.id,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", order.id);

    if (preferenceUpdateError) {
      console.error(
        "Erro ao salvar preferência no pedido:",
        preferenceUpdateError
      );

      /*
       * A preferência já existe no MP,
       * então não apagamos o pedido.
       * Mantemos para auditoria.
       */
      return NextResponse.json(
        {
          success: false,
          message:
            "O pagamento foi preparado, mas não foi possível finalizar o registro do pedido.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      orderId: order.id,

      preferenceId:
        result.id,

      initPoint:
        result.init_point,

      sandboxInitPoint:
        result.sandbox_init_point,
    });
  } catch (error) {
    console.error(
      "Erro ao criar checkout:",
      error
    );

    /*
     * Se o pedido chegou a ser criado,
     * mas a preferência falhou, removemos
     * esse pedido incompleto.
     */
    if (createdOrderId) {
      const {
        error: cleanupError,
      } = await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", createdOrderId)
        .is(
          "mercado_pago_preference_id",
          null
        );

      if (cleanupError) {
        console.error(
          "Erro ao limpar pedido incompleto:",
          cleanupError
        );
      }
    }

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