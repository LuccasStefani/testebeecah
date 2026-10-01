import { adminContent } from "@/src/content/admin";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";
import BannerEditor from "@/src/components/admin/BannerEditor";
import type { PopupConfig } from "@/src/lib/popup-types";
export default async function BannersPage() {
  const auth = await requireAdmin();
  if (!auth.authorized) redirect("/admin/login");
  const [{ data, error }, { data: products, error: productError }] = await Promise.all([
    supabaseAdmin
      .from("store_popup_config")
      .select("enabled,mode,banners")
      .eq("id", 1)
      .single(),
    supabaseAdmin
      .from("products")
      .select("id,name,price,promo_price,active,stock")
      .order("name"),
  ]);
  if (error || productError)
    return <p role="alert">{adminContent.naoFoiPossivelCarregarOsBannersAtualizeA}</p>;
  return <BannerEditor initial={data as PopupConfig} products={products ?? []} />;
}
