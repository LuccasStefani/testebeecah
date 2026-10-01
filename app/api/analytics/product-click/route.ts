import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase/admin";
import { requireAdmin } from "@/src/lib/auth/require-admin";
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return new NextResponse(null, { status: 403 });
  try {
    const raw = await request.text();
    if (raw.length > 1024) return new NextResponse(null, { status: 413 });
    const { slug, session } = JSON.parse(raw);
    if (
      typeof slug !== "string" ||
      slug.length > 200 ||
      typeof session !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        session,
      )
    )
      return new NextResponse(null, { status: 400 });
    const auth = await requireAdmin();
    if (auth.authorized) return new NextResponse(null, { status: 204 });
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    if (productError) return new NextResponse(null, { status: 503 });
    if (!product) return new NextResponse(null, { status: 404 });
    const { error } = await supabaseAdmin
      .from("product_clicks")
      .insert({ product_id: product.id, session_id: session });
    if (error && error.code !== "23505")
      return NextResponse.json({ error: "Medição indisponível" }, { status: 503 });
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 400 });
  }
}
