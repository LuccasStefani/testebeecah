import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";
import TestimonialModeration from "@/src/components/admin/TestimonialModeration";
import { testimonialFormContent as c } from "@/src/content/testimonial-form";

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const auth = await requireAdmin();
  if (!auth.authorized) redirect("/admin/login");
  const params = await searchParams;
  const status =
    params.status === "approved" || params.status === "rejected"
      ? params.status
      : "pending";
  const page = Math.max(1, Math.min(10000, Number(params.page) || 1));
  const { data, error, count } = await supabaseAdmin
    .from("testimonials")
    .select("id,author,body,instagram,status,created_at", { count: "exact" })
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range((page - 1) * 20, page * 20 - 1);
  return (
    <section className="p-5 text-white sm:p-8">
      <h1 className="text-3xl">{c.adminTitle}</h1>
      <p className="mt-2 text-sm text-neutral-400">{c.adminIntro}</p>
      <nav aria-label={c.adminTitle} className="my-7 flex flex-wrap gap-2">
        {[
          ["pending", c.pendingLabel],
          ["approved", c.approved],
          ["rejected", c.rejected],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={"/admin/comentarios?status=" + value}
            aria-current={status === value ? "page" : undefined}
            className={
              "rounded-xl px-4 py-3 text-sm " +
              (status === value
                ? "bg-white text-black"
                : "bg-neutral-900 text-neutral-400")
            }
          >
            {label}
          </Link>
        ))}
      </nav>
      {error ? (
        <p role="alert">{c.loadFailed}</p>
      ) : !data?.length ? (
        <p className="rounded-2xl bg-neutral-900 p-8 text-sm text-neutral-400">
          {c.empty}
        </p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.map((item) => (
            <article key={item.id} className="rounded-2xl bg-[#151515] p-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-medium">{item.author}</h2>
                <time className="text-xs text-neutral-500" dateTime={item.created_at}>
                  {new Date(item.created_at).toLocaleDateString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                  })}
                </time>
              </div>
              {item.instagram && (
                <a
                  href={"https://www.instagram.com/" + item.instagram + "/"}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs text-neutral-400 underline"
                >
                  @{item.instagram}
                </a>
              )}
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-300">
                {item.body}
              </p>
              <TestimonialModeration id={item.id} status={item.status} />
            </article>
          ))}
        </div>
      )}
      <div className="mt-6 flex gap-5 text-sm">
        {page > 1 && (
          <Link href={"?status=" + status + "&page=" + (page - 1)}>{c.previous}</Link>
        )}
        {(count ?? 0) > page * 20 && (
          <Link href={"?status=" + status + "&page=" + (page + 1)}>{c.next}</Link>
        )}
      </div>
    </section>
  );
}
