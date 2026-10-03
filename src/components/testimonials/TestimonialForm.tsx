"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { testimonialPageContent as pageContent } from "@/src/content/testimonial-page";
import { LoaderCircle, Send, Check } from "lucide-react";
import { notify } from "@/src/lib/notifications";
import { testimonialFormContent as c } from "@/src/content/testimonial-form";

const playfair = Playfair_Display({ subsets: ["latin"], weight: "400", display: "swap" });

export default function TestimonialForm({ signedIn }: { signedIn: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: fields.get("author"),
          instagram: fields.get("instagram"),
          text: fields.get("text"),
          consent: fields.get("consent") === "on",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || c.failed);
      setSent(true);
      form.reset();
      notify.success(c.success);
    } catch (error) {
      const text = error instanceof Error ? error.message : c.failed;
      setMessage(text);
      notify.error(text);
    } finally {
      setBusy(false);
    }
  }
  const input =
    "mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base focus:outline-2 focus:outline-[#2d416f]";
  return (
    <section
      id="enviar-depoimento"
      className="mt-12 grid scroll-mt-28 gap-8 border-t border-neutral-200 py-10 sm:mt-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-14"
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
          {pageContent.formEyebrow}
        </p>
        <h2
          className={
            playfair.className +
            " mt-4 max-w-xs text-4xl leading-tight tracking-[-0.04em]"
          }
        >
          {pageContent.formTitle}
        </h2>
        <p className="mt-4 max-w-xs text-sm leading-7 text-neutral-600">
          {pageContent.formDescription}
        </p>
        <p className="mt-6 max-w-xs text-xs leading-6 text-neutral-500">
          {pageContent.formNote}
        </p>
      </div>
      <div className="rounded-2xl bg-[#f6f5f2] p-6 sm:p-8">
        {!signedIn ? (
          <div className="flex h-full flex-col items-start justify-center gap-2 py-4">
            <p className="text-sm">{c.login}</p>
            <Link
              href="/login"
              className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-black px-5 text-sm text-white"
            >
              {c.loginAction}
            </Link>
          </div>
        ) : sent ? (
          <p role="status" className="mt-6 flex items-center gap-3 text-sm">
            <Check size={20} />
            {c.success}
          </p>
        ) : (
          <form onSubmit={submit} aria-busy={busy} className="max-w-3xl">
            <fieldset
              disabled={busy}
              className="grid gap-5 sm:grid-cols-2 disabled:opacity-60"
            >
              <label className="text-sm font-medium">
                {c.name}
                <input
                  name="author"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  placeholder={c.namePlaceholder}
                  className={input}
                />
              </label>
              <label className="text-sm font-medium">
                {c.instagram}
                <input
                  name="instagram"
                  maxLength={31}
                  autoCapitalize="none"
                  spellCheck={false}
                  pattern="@?[A-Za-z0-9_][A-Za-z0-9_.]{0,29}"
                  placeholder={c.instagramPlaceholder}
                  className={input}
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                {c.message}
                <textarea
                  name="text"
                  required
                  minLength={20}
                  maxLength={1000}
                  rows={4}
                  placeholder={c.messagePlaceholder}
                  className={input + " resize-y"}
                />
              </label>
              <label className="flex items-start gap-3 text-xs leading-5 text-neutral-600 sm:col-span-2">
                <input
                  type="checkbox"
                  name="consent"
                  required
                  className="mt-1 size-4 shrink-0 accent-black"
                />
                {c.consent}
              </label>
              {message && (
                <p role="alert" className="text-sm text-red-700 sm:col-span-2">
                  {message}
                </p>
              )}
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm text-white sm:justify-self-start"
              >
                {busy ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {busy ? c.sending : c.submit}
              </button>
            </fieldset>
          </form>
        )}
      </div>
    </section>
  );
}
