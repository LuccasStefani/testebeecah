import { whatsappCartContent as content } from "@/src/content/whatsapp-cart";

type ShareItem = {
  name: string;
  price: number;
  quantity: number;
  stock: number;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function buildCartWhatsAppUrl(items: readonly ShareItem[]): string | null {
  if (items.length === 0) return null;

  const lines = items.map((item) => {
    const name = item.name.replace(/[\r\n]+/g, " ");
    const total = currency.format(item.price * item.quantity);
    const unit = currency.format(item.price);
    return `${item.quantity} × ${name} — ${total} (${unit} ${content.each})${item.stock < item.quantity ? ` ${content.unavailable}` : ""}`;
  });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const message = [
    content.greeting,
    "",
    ...lines,
    "",
    `${content.subtotal}: ${currency.format(subtotal)}`,
    content.shipping,
  ].join("\n");

  return `https://wa.me/${content.phone}?text=${encodeURIComponent(message)}`;
}
