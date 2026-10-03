import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";
import { testimonialFormContent as c } from "@/src/content/testimonial-form";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.authorized)
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return new NextResponse(null, { status: 403 });
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    return new NextResponse(null, { status: 400 });
  try {
    const raw = await request.text();
    if (raw.length > 200) return new NextResponse(null, { status: 413 });
    const { status } = JSON.parse(raw);
    if (status !== "approved" && status !== "rejected")
      return new NextResponse(null, { status: 400 });
    const { data, error } = await supabaseAdmin
      .from("testimonials")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: auth.user.id,
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) return NextResponse.json({ error: c.updateFailed }, { status: 500 });
    if (!data) return new NextResponse(null, { status: 404 });
    revalidatePath("/");
    revalidatePath("/depoimentos");
    revalidatePath("/admin/comentarios");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: c.updateFailed }, { status: 400 });
  }
}
