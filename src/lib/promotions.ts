export function isPromotionDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T12:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function activePromoPrice(
  product: {
    price: number | string;
    promo_price: number | string | null;
    promo_ends_on?: string | null;
  },
  now = new Date(),
): number | undefined {
  if (product.promo_price === null) return undefined;
  const price = Number(product.promo_price);
  if (!Number.isFinite(price) || price < 0 || price >= Number(product.price))
    return undefined;
  if (product.promo_ends_on) {
    const today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Sao_Paulo",
    }).format(now);
    if (!isPromotionDate(product.promo_ends_on) || product.promo_ends_on < today)
      return undefined;
  }
  return price;
}

export function formatPromotionDate(value: string): string {
  return value.split("-").reverse().join("/");
}
