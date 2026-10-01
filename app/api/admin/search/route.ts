import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";
type Result = { id: string; title: string; detail: string; href: string; group: string };
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized)
    return NextResponse.json({ error: "Não autorizado" }, { status: auth.status });
  const q = (request.nextUrl.searchParams.get("q") || "")
    .trim()
    .slice(0, 100)
    .toLocaleLowerCase("pt-BR");
  if (q.length < 2)
    return NextResponse.json(
      { results: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  try {
    const results: Result[] = [];
    const errors: string[] = [];
    await Promise.all([
      (async () => {
        for (let offset = 0, count = 0; count < 6; offset += 500) {
          const { data, error } = await supabaseAdmin
            .from("products")
            .select("id,name,brand,stock")
            .order("id")
            .range(offset, offset + 499);
          if (error) {
            errors.push("produtos");
            break;
          }
          for (const p of data ?? []) {
            if (
              (p.name + " " + p.brand).toLocaleLowerCase("pt-BR").includes(q) &&
              count < 6
            ) {
              results.push({
                id: p.id,
                title: p.name,
                detail: (p.brand || "Perfume") + " · Estoque: " + p.stock,
                href: "/admin/produtos/" + p.id + "/editar",
                group: "Produtos",
              });
              count++;
            }
          }
          if (!data || data.length < 500) break;
        }
      })(),
      (async () => {
        const needle = q.replace(/^#/, "");
        for (let offset = 0, count = 0; count < 6; offset += 500) {
          const { data, error } = await supabaseAdmin
            .from("orders")
            .select("id,status,mercado_pago_payment_id")
            .order("created_at", { ascending: false })
            .order("id")
            .range(offset, offset + 499);
          if (error) {
            errors.push("pedidos");
            break;
          }
          for (const o of data ?? []) {
            if (
              (o.id.toLowerCase().includes(needle) ||
                String(o.mercado_pago_payment_id || "").includes(needle)) &&
              count < 6
            ) {
              results.push({
                id: o.id,
                title: "Pedido #" + o.id.slice(0, 8),
                detail: "Abrir detalhes do pedido",
                href: "/admin/pedidos/" + o.id,
                group: "Pedidos",
              });
              count++;
            }
          }
          if (!data || data.length < 500) break;
        }
      })(),
      (async () => {
        for (let page = 1, count = 0; count < 6; page++) {
          const { data, error } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage: 200,
          });
          if (error) {
            errors.push("clientes");
            break;
          }
          if (!data.users.length) break;
          const { data: profiles, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("id,full_name")
            .in(
              "id",
              data.users.map((u) => u.id),
            );
          if (profileError) {
            errors.push("clientes");
            break;
          }
          const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
          for (const u of data.users) {
            const name = names.get(u.id) || "Nome não informado";
            if (
              (name + " " + (u.email || "")).toLocaleLowerCase("pt-BR").includes(q) &&
              count < 6
            ) {
              results.push({
                id: u.id,
                title: name,
                detail: u.email || "Sem e-mail",
                href:
                  "/admin/clientes?tipo=todos&q=" + encodeURIComponent(u.email || name),
                group: "Clientes",
              });
              count++;
            }
          }
          if (data.users.length < 200) break;
        }
      })(),
    ]);
    const sections = [
      { title: "Dashboard", href: "/admin" },
      { title: "Produtos e perfumes", href: "/admin/produtos" },
      { title: "Cadastrar produto", href: "/admin/produtos/novo" },
      { title: "Estoque", href: "/admin/estoque" },
      { title: "Pedidos", href: "/admin/pedidos" },
      { title: "Clientes", href: "/admin/clientes" },
    ];
    for (const p of sections)
      if (p.title.toLocaleLowerCase("pt-BR").includes(q))
        results.push({
          id: p.href,
          title: p.title,
          detail: "Ir para seção",
          href: p.href,
          group: "Atalhos",
        });
    return NextResponse.json(
      { results, errors },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Busca indisponível. Tente novamente." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
