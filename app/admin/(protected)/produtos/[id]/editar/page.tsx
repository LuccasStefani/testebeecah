import { parseProductType } from "@/src/content/product-types";
import { notFound, redirect } from "next/navigation";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

import EditProductForm from "./EditProductForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({ params }: PageProps) {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    redirect("/admin/login");
  }

  const { id } = await params;

  const { data: product, error } = await supabaseAdmin
    .from("products")
    .select(
      "\n      id,\n      name,\n      brand,\n      description,\n      price,\n      promo_price,promo_ends_on,\n      stock,\n      weight,\n      width,\n      height,\n      length,\n      category,\n      product_type,\n      is_arabian,\n      is_new,\n      volume,\n      fragrance_family,\n      top_notes,\n      heart_notes,\n      base_notes,\n      featured,\n      active,\n      product_images (\n        id,\n        image_url,\n        position,\n        is_cover\n      )\n    ",
    )
    .eq("id", id)
    .single();

  if (error || !product) {
    notFound();
  }

  const images = [...(product.product_images ?? [])].sort(
    (a, b) => Number(a.position) - Number(b.position),
  );

  return (
    <EditProductForm
      product={{
        id: product.id,
        name: product.name,
        brand: product.brand,
        description: product.description,

        price: Number(product.price),

        promoPrice: product.promo_price !== null ? Number(product.promo_price) : null,

        promoEndsOn: product.promo_ends_on,
        stock: product.stock,
        isArabian: product.is_arabian,
        isNew: product.is_new,

        weight: product.weight !== null ? Number(product.weight) : null,

        width: product.width !== null ? Number(product.width) : null,

        height: product.height !== null ? Number(product.height) : null,

        length: product.length !== null ? Number(product.length) : null,

        category: product.category,
        productType: parseProductType(product.product_type),

        volume: product.volume ?? "",

        fragranceFamily: product.fragrance_family ?? "",

        topNotes: (product.top_notes ?? []) as string[],

        heartNotes: (product.heart_notes ?? []) as string[],

        baseNotes: (product.base_notes ?? []) as string[],

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
