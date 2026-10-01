import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

// Only the ordered product IDs leave this server module; no order/customer data is sent to clients.
export const getBestSellerIds = cache(async () => {
  const totals = new Map<string, number>();
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabaseAdmin
      .from("order_items")
      .select("id,product_id,quantity,orders!inner(status)")
      .eq("orders.status", "approved")
      .order("id")
      .range(offset, offset + 499);
    if (error) {
      console.error("Não foi possível carregar mais vendidos:", error.message);
      return { ids: [] as string[], failed: true };
    }
    for (const item of data ?? []) {
      if (item.product_id && Number(item.quantity) > 0)
        totals.set(
          item.product_id,
          (totals.get(item.product_id) ?? 0) + Number(item.quantity),
        );
    }
    if (!data || data.length < 500) break;
  }
  return {
    ids: [...totals]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([id]) => id),
    failed: false,
  };
});
