import {
  InvalidWebhookSignatureError,
  Payment,
  WebhookSignatureValidator,
} from "mercadopago";
import { NextResponse } from "next/server";

import { mercadoPagoClient } from "@/src/lib/mercadopago/client";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

function mapPaymentStatus(
  status: string | undefined
) {
  switch (status) {
    case "approved":
      return "approved";

    case "rejected":
      return "rejected";

    case "cancelled":
      return "cancelled";

    case "refunded":
      return "refunded";

    default:
      return "pending";
  }
}

export async function POST(request: Request) {
  try {
    const webhookSecret =
      process.env.MERCADO_PAGO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(
        "MERCADO_PAGO_WEBHOOK_SECRET não configurado."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Webhook secret não configurado.",
        },
        { status: 500 }
      );
    }

    const url = new URL(request.url);

    const queryDataId =
      url.searchParams.get("data.id") ??
      url.searchParams.get("data_id");

    const xSignature =
      request.headers.get("x-signature");

    const xRequestId =
      request.headers.get("x-request-id");

    const body = await request.json();

    const paymentId =
      queryDataId ??
      body?.data?.id?.toString();

    if (!paymentId) {
      return NextResponse.json({
        success: true,
        ignored: true,
      });
    }

    if (
      !xSignature ||
      !xRequestId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Assinatura do webhook ausente.",
        },
        { status: 401 }
      );
    }

    try {
      WebhookSignatureValidator.validate({
        xSignature,
        xRequestId,
        dataId: paymentId,
        secret: webhookSecret,
      });
    } catch (error) {
      if (
        error instanceof
        InvalidWebhookSignatureError
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Assinatura do webhook inválida.",
          },
          { status: 401 }
        );
      }

      throw error;
    }

    /*
     * Ignora notificações que não sejam
     * relacionadas a payment.
     */
    if (
      body?.type &&
      body.type !== "payment"
    ) {
      return NextResponse.json({
        success: true,
        ignored: true,
      });
    }

    const paymentClient =
      new Payment(mercadoPagoClient);

    const payment =
      await paymentClient.get({
        id: paymentId,
      });

    const orderId =
      payment.external_reference ??
      payment.metadata?.order_id;

    if (!orderId) {
      console.error(
        "Pagamento sem external_reference/order_id:",
        paymentId
      );

      return NextResponse.json({
        success: true,
        ignored: true,
      });
    }

    const orderStatus =
      mapPaymentStatus(payment.status);

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        user_id,
        status
      `)
      .eq("id", orderId)
      .single();

    if (
      orderError ||
      !order
    ) {
      console.error(
        "Pedido não encontrado para webhook:",
        orderId,
        orderError
      );

      return NextResponse.json({
        success: true,
        ignored: true,
      });
    }

    /*
     * Idempotência:
     * se já está approved, não processa
     * estoque/carrinho novamente.
     */
    const wasAlreadyApproved =
      order.status === "approved";

    const {
      error: updateOrderError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        status: orderStatus,

        mercado_pago_payment_id:
          payment.id?.toString() ??
          paymentId,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateOrderError) {
      console.error(
        "Erro ao atualizar pedido:",
        updateOrderError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível atualizar o pedido.",
        },
        { status: 500 }
      );
    }

    /*
     * Só baixa estoque e limpa carrinho
     * na primeira confirmação approved.
     */
    if (
      orderStatus === "approved" &&
      !wasAlreadyApproved
    ) {
      const {
        data: orderItems,
        error: orderItemsError,
      } = await supabaseAdmin
        .from("order_items")
        .select(`
          product_id,
          quantity
        `)
        .eq("order_id", order.id);

      if (orderItemsError) {
        console.error(
          "Erro ao buscar itens do pedido:",
          orderItemsError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Não foi possível processar os itens do pedido.",
          },
          { status: 500 }
        );
      }

      for (const item of orderItems ?? []) {
        if (!item.product_id) {
          continue;
        }

        const {
          data: product,
          error: productError,
        } = await supabaseAdmin
          .from("products")
          .select("stock")
          .eq(
            "id",
            item.product_id
          )
          .single();

        if (
          productError ||
          !product
        ) {
          console.error(
            "Erro ao carregar estoque do produto:",
            item.product_id,
            productError
          );

          continue;
        }

        const newStock =
          Math.max(
            0,
            Number(product.stock) -
              Number(item.quantity)
          );

        const {
          error: stockError,
        } = await supabaseAdmin
          .from("products")
          .update({
            stock: newStock,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            item.product_id
          );

        if (stockError) {
          console.error(
            "Erro ao atualizar estoque:",
            item.product_id,
            stockError
          );
        }
      }

      const {
        error: clearCartError,
      } = await supabaseAdmin
        .from("cart_items")
        .delete()
        .eq(
          "user_id",
          order.user_id
        );

      if (clearCartError) {
        console.error(
          "Erro ao limpar carrinho após pagamento:",
          clearCartError
        );
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Erro no webhook Mercado Pago:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erro interno no webhook.",
      },
      { status: 500 }
    );
  }
}