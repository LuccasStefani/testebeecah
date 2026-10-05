import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";
import { mercadoPagoClient } from "@/src/lib/mercadopago/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const auth = await requireAdmin();
  if (!auth.authorized)
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  const { id } = await params;
  let claim: string | null = null;
  try {
    const body = await request.json();
    const shipping = body.shippingPrice;
    if (
      body.deliveryConfirmed !== true ||
      typeof shipping !== "number" ||
      !Number.isFinite(shipping) ||
      shipping < 0 ||
      shipping > 10000 ||
      Math.abs(shipping * 100 - Math.round(shipping * 100)) > 0.00001
    ) {
      return NextResponse.json(
        {
          message:
            "Confirme a entrega e informe um frete válido, com até duas casas decimais.",
        },
        { status: 400 },
      );
    }
    const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    if (!origin || new URL(origin).protocol !== "https:") {
      return NextResponse.json(
        {
          message:
            "Configure NEXT_PUBLIC_SITE_URL com o endereço HTTPS publicado da loja para receber o retorno do Mercado Pago.",
        },
        { status: 503 },
      );
    }
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id,user_id,status,total,subtotal,shipping_price,checkout_channel,checkout_shipping_locked,checkout_payment_url,mercado_pago_preference_id,expires_at,order_items(product_id,product_name,unit_price,quantity)",
      )
      .eq("id", id)
      .eq("checkout_channel", "whatsapp")
      .single();
    if (error || !order)
      return NextResponse.json({ message: "Pedido não encontrado." }, { status: 404 });
    if (order.status !== "pending" || new Date(order.expires_at).getTime() <= Date.now())
      return NextResponse.json(
        { message: "Este pedido não está disponível para pagamento." },
        { status: 409 },
      );
    if (order.checkout_payment_url) return NextResponse.json({ success: true });
    if (order.checkout_shipping_locked && Number(order.shipping_price) !== shipping) {
      return NextResponse.json(
        {
          message:
            "O frete já foi confirmado. Reutilize o valor registrado para recuperar o link.",
        },
        { status: 409 },
      );
    }
    const { data: products, error: productError } = await supabaseAdmin
      .from("products")
      .select("id,stock,active")
      .in(
        "id",
        order.order_items.map((item) => item.product_id),
      );
    if (
      productError ||
      !order.order_items.length ||
      order.order_items.some(
        (item) =>
          !products?.some(
            (p) => p.id === item.product_id && p.active && p.stock >= item.quantity,
          ),
      )
    ) {
      return NextResponse.json(
        { message: "Há produtos indisponíveis. Revise o pedido antes de cobrar." },
        { status: 409 },
      );
    }
    const started = new Date().toISOString();
    const { data: locked, error: lockError } = await supabaseAdmin
      .from("orders")
      .update({
        checkout_payment_started_at: started,
        checkout_shipping_locked: true,
        shipping_price: shipping,
        total: Number((Number(order.subtotal) + shipping).toFixed(2)),
        expires_at: order.checkout_shipping_locked
          ? order.expires_at
          : new Date(Date.now() + 86400000).toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending")
      .eq("checkout_shipping_locked", order.checkout_shipping_locked)
      .is("checkout_payment_url", null)
      .or(
        `checkout_payment_started_at.is.null,checkout_payment_started_at.lt.${new Date(Date.now() - 120000).toISOString()}`,
      )
      .select("id,total,expires_at")
      .maybeSingle();
    if (lockError || !locked)
      return NextResponse.json(
        { message: "O pagamento já está sendo preparado. Aguarde e atualize o pedido." },
        { status: 409 },
      );
    claim = started;
    const client = new Preference(mercadoPagoClient);
    // Recover a previous successful API call if saving its response was interrupted.
    const previous = await client.search({ options: { external_reference: id } });
    let preference;
    if (previous.elements?.length) {
      preference = await client.get({ preferenceId: previous.elements[0].id });
    } else {
      const items = order.order_items.map((item) => ({
        id: item.product_id,
        title: item.product_name,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        currency_id: "BRL",
      }));
      if (shipping > 0)
        items.push({
          id: "shipping",
          title: "Entrega combinada com a Beecah",
          quantity: 1,
          unit_price: shipping,
          currency_id: "BRL",
        });
      const returnUrl = `${origin}/checkout/pedido/${id}`;
      preference = await client.create({
        requestOptions: { idempotencyKey: id, timeout: 15000 },
        body: {
          items,
          external_reference: id,
          metadata: { order_id: id, checkout_channel: "whatsapp" },
          back_urls: { success: returnUrl, failure: returnUrl, pending: returnUrl },
          auto_return: "approved",
          notification_url: `${origin}/api/mercadopago/webhook`,
          expires: true,
          expiration_date_to: locked.expires_at,
        },
      });
    }
    const paymentUrl = preference.init_point;
    if (
      !preference.id ||
      !paymentUrl ||
      !/^https:\/\/([a-z0-9-]+\.)?mercadopago\.(com|com\.br)\//i.test(paymentUrl)
    )
      throw new Error("Invalid payment preference");
    const { error: saveError } = await supabaseAdmin
      .from("orders")
      .update({
        mercado_pago_preference_id: preference.id,
        checkout_payment_url: paymentUrl,
        checkout_payment_started_at: null,
      })
      .eq("id", id)
      .eq("checkout_payment_started_at", claim);
    if (saveError) throw saveError;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao liberar pagamento WhatsApp:", error);
    if (claim)
      await supabaseAdmin
        .from("orders")
        .update({ checkout_payment_started_at: null })
        .eq("id", id)
        .eq("checkout_payment_started_at", claim);
    return NextResponse.json(
      {
        message:
          "Não foi possível preparar o pagamento. O pedido foi preservado; tente novamente.",
      },
      { status: 502 },
    );
  }
}
