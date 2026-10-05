import { whatsappCartContent } from "@/src/content/whatsapp-cart";
export const formatOrderMoney = (value: number | string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value),
  );
export function orderNumber(id: string) {
  return id.slice(0, 8).toUpperCase();
}
export function orderWhatsAppUrl(order: {
  id: string;
  subtotal: number | string;
  order_items: { product_name: string; quantity: number; subtotal: number | string }[];
}) {
  const message = [
    `Olá, Beecah! Quero combinar a entrega do pedido #${orderNumber(order.id)}.`,
    "",
    ...order.order_items.map(
      (item) =>
        `${item.quantity} × ${item.product_name.replace(/[\r\n]+/g, " ")} — ${formatOrderMoney(item.subtotal)}`,
    ),
    "",
    `Subtotal dos produtos: ${formatOrderMoney(order.subtotal)}`,
    "Frete a combinar antes do pagamento pelo Mercado Pago.",
    `Referência: ${order.id}`,
  ].join("\n");
  return `https://wa.me/${whatsappCartContent.phone}?text=${encodeURIComponent(message)}`;
}
export function orderPhase(status: string, ready: boolean, expired: boolean) {
  if (status === "approved") return "paid";
  if (status !== "pending" || expired) return "terminal";
  return ready ? "ready" : "waiting";
}
