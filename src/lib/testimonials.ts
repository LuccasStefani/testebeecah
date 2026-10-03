import "server-only";
import { supabaseAdmin } from "@/src/lib/supabase/admin";
import { testimonials as examples, type Testimonial } from "@/src/content/testimonials";

export async function getTestimonials(): Promise<{
  items: Testimonial[];
  failed: boolean;
}> {
  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .select("id,author,body,instagram")
    .eq("status", "approved")
    .order("reviewed_at", { ascending: false })
    .limit(60);
  if (error) return { items: examples, failed: true };
  const real: Testimonial[] = (data ?? []).map((row) => ({
    id: row.id,
    author: row.author,
    text: row.body,
    instagram: row.instagram ?? undefined,
    example: false,
  }));
  return { items: [...real, ...examples], failed: false };
}
