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
        status,
        stock_processed_at
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
     * Pagamento aprovado:
     * processa o estoque de forma atômica.
     *
     * A função no PostgreSQL garante que
     * o mesmo pedido não baixe estoque
     * duas vezes.
     */
    if (orderStatus === "approved") {
      const {
        data: stockProcessed,
        error: stockError,
      } = await supabaseAdmin.rpc(
        "process_order_stock",
        {
          p_order_id: order.id,
        }
      );

      if (stockError) {
        console.error(
          "Erro ao processar estoque do pedido:",
          order.id,
          stockError
        );

        /*
         * Retornamos 500 para que a notificação
         * possa ser reenviada posteriormente.
         *
         * O pedido ainda não é marcado como
         * aprovado enquanto o estoque não for
         * processado corretamente.
         */
        return NextResponse.json(
          {
            success: false,
            message:
              "Não foi possível processar o estoque do pedido.",
          },
          { status: 500 }
        );
      }

      console.log(
        stockProcessed
          ? `Estoque processado para o pedido ${order.id}.`
          : `Estoque do pedido ${order.id} já havia sido processado.`
      );
    }

    /*
     * Depois do processamento do estoque,
     * atualizamos o status financeiro do pedido.
     */
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
     * Depois da aprovação, limpamos o carrinho.
     *
     * Se o webhook for recebido novamente,
     * apagar um carrinho já vazio não causa
     * nenhum problema.
     */
    if (orderStatus === "approved") {
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