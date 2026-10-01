import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized)
    return NextResponse.json({ error: "Não autorizado" }, { status: auth.status });
  if (req.headers.get("origin") !== req.nextUrl.origin)
    return new NextResponse(null, { status: 403 });
  try {
    const raw = await req.text();
    if (raw.length > 40000) return new NextResponse(null, { status: 413 });
    const config = JSON.parse(raw);
    if (
      typeof config.enabled !== "boolean" ||
      !["fixed", "slides"].includes(config.mode) ||
      !Array.isArray(config.banners) ||
      config.banners.length > 20
    )
      throw Error("Configuração inválida.");
    const ids = new Set();
    let pins = 0;
    for (const b of config.banners) {
      if (
        typeof b.id !== "string" ||
        !/^[0-9a-f-]{36}$/i.test(b.id) ||
        ids.has(b.id) ||
        typeof b.productId !== "string" ||
        !/^[0-9a-f-]{36}$/i.test(b.productId) ||
        typeof b.title !== "string" ||
        !b.title.trim() ||
        b.title.length > 100 ||
        typeof b.description !== "string" ||
        b.description.length > 300 ||
        typeof b.imageUrl !== "string" ||
        b.imageUrl.length > 2000 ||
        typeof b.active !== "boolean" ||
        typeof b.pinned !== "boolean"
      )
        throw Error("Confira os campos de cada banner.");
      if (b.imageUrl && !/^https:\/\//.test(b.imageUrl) && !/^\/(?!\/)/.test(b.imageUrl))
        throw Error("Use uma imagem HTTPS ou um caminho local.");
      ids.add(b.id);
      if (b.pinned) pins++;
    }
    if (pins > 1) throw Error("Fixe apenas um banner.");
    const { error } = await supabaseAdmin
      .from("store_popup_config")
      .update({
        enabled: config.enabled,
        mode: config.mode,
        banners: config.banners,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error)
      return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Dados inválidos" },
      { status: 400 },
    );
  }
}
