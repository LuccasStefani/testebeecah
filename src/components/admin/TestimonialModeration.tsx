"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, LoaderCircle } from "lucide-react";
import { notify } from "@/src/lib/notifications";
import { testimonialFormContent as c } from "@/src/content/testimonial-form";

export default function TestimonialModeration({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function update(next: "approved" | "rejected") {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/testimonials/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) throw new Error(c.updateFailed);
      notify.success(c.updated);
      router.refresh();
    } catch {
      notify.error(c.updateFailed);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {status !== "approved" && (
        <button
          disabled={busy}
          onClick={() => update("approved")}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-medium text-black disabled:opacity-50"
        >
          {busy ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <Check size={15} />
          )}
          {c.approve}
        </button>
      )}
      {status !== "rejected" && (
        <button
          disabled={busy}
          onClick={() => update("rejected")}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-neutral-800 px-4 text-xs text-white disabled:opacity-50"
        >
          <X size={15} />
          {status === "approved" ? c.unpublish : c.reject}
        </button>
      )}
    </div>
  );
}
