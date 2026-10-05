import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { supabaseAdmin } from "@/src/lib/supabase/admin";
import { orderWhatsAppUrl } from "@/src/lib/assisted-order";
import { checkoutMode } from "@/src/lib/checkout-mode";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  }
  if (checkoutMode !== "whatsapp")
    return NextResponse.json({ message: "Fluxo indisponível." }, { status: 409 });
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user)
    return NextResponse.json(
      { message: "Entre na sua conta para salvar o pedido." },
      { status: 401 },
    );
  const { data: orderId, error: orderError } = await supabaseAdmin.rpc(
    "prepare_whatsapp_order",
    { p_user_id: user.id },
  );
  if (orderError) {
    console.error("Erro ao registrar pedido WhatsApp:", orderError);
    return NextResponse.json(
      {
        message:
          orderError.code === "P0001"
            ? orderError.message
            : "Não foi possível registrar o pedido.",
      },
      { status: 400 },
    );
  }
  const { data: order, error: snapshotError } = await supabaseAdmin
    .from("orders")
    .select("id,subtotal,order_items(product_name,quantity,subtotal)")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();
  if (snapshotError || !order)
    return NextResponse.json(
      {
        message:
          "Pedido salvo, mas não foi possível preparar a mensagem. Tente novamente.",
      },
      { status: 500 },
    );
  return NextResponse.json(
    { orderId, whatsappUrl: orderWhatsAppUrl(order) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
