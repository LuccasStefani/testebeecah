"use client";

import { startTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function CatalogSync({ revision }: { revision: string | null }) {
  const router = useRouter();
  const current = useRef(revision);

  useEffect(() => {
    current.current = revision;
  }, [revision]);

  useEffect(() => {
    let stopped = false;
    let pending = false;
    let controller: AbortController | undefined;

    async function check() {
      if (stopped || pending || document.hidden || !navigator.onLine) return;
      pending = true;
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 10000);
      try {
        const response = await fetch("/api/catalog/revision", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data: { revision?: string } = await response.json();
        if (stopped || typeof data.revision !== "string") return;
        if (current.current !== data.revision) {
          current.current = data.revision;
          window.dispatchEvent(new Event("beecah:catalog-updated"));
          startTransition(() => router.refresh());
        }
      } catch {
        // Keep the current catalog during a network interruption and retry later.
      } finally {
        window.clearTimeout(timeout);
        pending = false;
      }
    }

    const interval = window.setInterval(check, 15000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("online", check);
    window.addEventListener("focus", check);
    void check();
    return () => {
      stopped = true;
      controller?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("online", check);
      window.removeEventListener("focus", check);
    };
  }, [router]);

  return null;
}
