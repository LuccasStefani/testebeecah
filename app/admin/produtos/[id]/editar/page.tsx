import {
  notFound,
  redirect,
} from "next/navigation";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

import EditProductForm from "./EditProductForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({
  params,
}: PageProps) {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    redirect("/admin/login");
  }

  const { id } = await params;

  const { data: product, error } =
    await supabaseAdmin
      .from("products")
      .select(`
        id,
        name,
        brand,
        description,
        price,
        promo_price,
        stock,
        category,
        volume,
        fragrance_family,
        top_notes,
        heart_notes,
        base_notes,
        featured,
        active,
        product_images (
          id,
          image_url,
          position,
          is_cover
        )
      `)
      .eq("id", id)
      .single();

  if (error || !product) {
    notFound();
  }

  const images = [
    ...(product.product_images ?? []),
  ].sort(
    (a, b) =>
      Number(a.position) -
      Number(b.position)
  );

  return (
    <EditProductForm
      product={{
        id: product.id,
        name: product.name,
        brand: product.brand,
        description: product.description,

        price: Number(product.price),

        promoPrice:
          product.promo_price !== null
            ? Number(product.promo_price)
            : null,

        stock: product.stock,
        category: product.category,

        volume:
          product.volume ?? "",

        fragranceFamily:
          product.fragrance_family ?? "",

        topNotes:
          (product.top_notes ?? []) as string[],

        heartNotes:
          (product.heart_notes ?? []) as string[],

        baseNotes:
          (product.base_notes ?? []) as string[],

        featured: product.featured,
        active: product.active,

        images: images.map((image) => ({
          id: image.id,
          imageUrl: image.image_url,
          position: image.position,
          isCover: image.is_cover,
        })),
      }}
    />
  );
}