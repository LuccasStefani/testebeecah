import { redirect } from "next/navigation";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";
import Dashboard, {
  type ProductMetric,
  type OrderMetric,
  type SaleMetric,
} from "@/src/components/admin/Dashboard";

export default async function AdminPage() {
  const auth = await requireAdmin();
  if (!auth.authorized) redirect("/admin/login");
  const updatedAt = new Date().toISOString();
  const since = new Date(new Date(updatedAt).getTime() - 90 * 86400000).toISOString();
  async function load(table: string, columns: string, dateColumn?: string) {
    const rows: unknown[] = [];
    for (let offset = 0; ; offset += 1000) {
      let query = supabaseAdmin
        .from(table)
        .select(columns)
        .order("id")
        .range(offset, offset + 999);
      if (dateColumn) query = query.gte(dateColumn, since);
      if (table === "order_items") query = query.eq("orders.status", "approved");
      const { data, error } = await query;
      if (error) return { rows: [], failed: true };
      rows.push(...(data ?? []));
      if (!data || data.length < 1000) return { rows, failed: false };
    }
  }
  const [products, orders, sales, favorites, clicks] = await Promise.all([
    load("products", "id,name,stock,active"),
    load("orders", "id,status,total,created_at", "created_at"),
    load(
      "order_items",
      "id,product_id,product_name,quantity,subtotal,orders!inner(created_at,status)",
      "orders.created_at",
    ),
    load("favorites", "id,product_id"),
    load("product_clicks", "id,product_id,created_at", "created_at"),
  ]);
  const errors = Object.entries({ products, orders, sales, favorites, clicks })
    .filter(([, v]) => v.failed)
    .map(([key]) => key);
  return (
    <Dashboard
      data={{
        products: products.rows as ProductMetric[],
        orders: orders.rows as OrderMetric[],
        sales: sales.rows as SaleMetric[],
        favorites: favorites.rows as { product_id: string }[],
        clicks: clicks.rows as { product_id: string; created_at: string }[],
        errors,
        updatedAt,
      }}
    />
  );
}
