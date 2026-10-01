import { supabaseAdmin } from "@/src/lib/supabase/admin";
import type { PopupConfig, PopupSlide } from "@/src/lib/popup-types";
import PromotionPopup from "./PromotionPopup";
export default async function PromotionPopupServer() {
  const { data, error } = await supabaseAdmin
    .from("store_popup_config")
    .select("enabled,mode,banners")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data?.enabled) return null;
  const config = data as PopupConfig;
  const active = config.banners.filter((b) => b.active);
  if (!active.length) return null;
  const { data: products, error: productError } = await supabaseAdmin
    .from("products")
    .select("id,name,slug,price,promo_price,product_images(image_url,position,is_cover)")
    .in(
      "id",
      active.map((b) => b.productId),
    )
    .eq("active", true)
    .gt("stock", 0);
  if (productError) return null;
  const slides: PopupSlide[] = active.flatMap((b) => {
    const p = products?.find((p) => p.id === b.productId);
    if (
      !p ||
      !p.promo_price ||
      Number(p.promo_price) >= Number(p.price) ||
      Number(p.promo_price) <= 0
    )
      return [];
    const images = [...(p.product_images ?? [])].sort(
      (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position,
    );
    return [
      {
        id: b.id,
        title: b.title,
        description: b.description,
        image: b.imageUrl || images[0]?.image_url || "/images/banners/bghero2.jpg",
        name: p.name,
        href: "/perfumes/" + p.slug,
        price: Number(p.price),
        promoPrice: Number(p.promo_price),
      },
    ];
  });
  const pinned = active.find((b) => b.pinned);
  const pinnedSlide = slides.find((s) => s.id === pinned?.id);
  const selected =
    config.mode === "fixed"
      ? [pinnedSlide || slides[0]].filter(Boolean)
      : pinnedSlide
        ? [pinnedSlide, ...slides.filter((s) => s.id !== pinnedSlide.id)]
        : slides;
  if (!selected.length) return null;
  return <PromotionPopup slides={selected} mode={config.mode} />;
}
