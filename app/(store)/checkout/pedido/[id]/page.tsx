import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import OrderReceipt from "@/src/components/checkout/OrderReceipt";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/checkout/pedido/" + id)}`);
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id,status,total,subtotal,shipping_price,checkout_channel,checkout_payment_url,expires_at,order_items(id,product_name,quantity,subtotal)",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o pedido. Tente novamente.");
  if (!order) notFound();
  // This authenticated server response evaluates expiry once per request.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const expired = !!order.expires_at && new Date(order.expires_at).getTime() <= now;
  return <OrderReceipt order={order} expired={expired} />;
}
