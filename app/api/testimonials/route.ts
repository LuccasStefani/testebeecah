import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { supabaseAdmin } from "@/src/lib/supabase/admin";
import { parseTestimonial } from "@/src/lib/validation/testimonial";
import { testimonialFormContent as c } from "@/src/content/testimonial-form";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return new NextResponse(null, { status: 403 });
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: c.login }, { status: 401 });
  try {
    const raw = await request.text();
    if (raw.length > 6000)
      return NextResponse.json({ error: c.invalid }, { status: 413 });
    const parsed = parseTestimonial(JSON.parse(raw));
    if (!parsed) return NextResponse.json({ error: c.invalid }, { status: 400 });
    const { data: recent, error: lookupError } = await supabaseAdmin
      .from("testimonials")
      .select("created_at,status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lookupError) return NextResponse.json({ error: c.failed }, { status: 500 });
    if (recent?.status === "pending")
      return NextResponse.json({ error: c.pending }, { status: 409 });
    if (recent && Date.now() - Date.parse(recent.created_at) < 86400000)
      return NextResponse.json({ error: c.tooSoon }, { status: 429 });
    const { error } = await supabaseAdmin
      .from("testimonials")
      .insert({
        ...parsed,
        user_id: user.id,
        status: "pending",
        consent_at: new Date().toISOString(),
      });
    if (error)
      return NextResponse.json(
        { error: error.code === "23505" ? c.pending : c.failed },
        { status: error.code === "23505" ? 409 : 500 },
      );
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: c.invalid }, { status: 400 });
  }
}
