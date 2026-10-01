"use client";

import { useEffect } from "react";
export default function ClickTracking() {
  useEffect(() => {
    function track(event: MouseEvent) {
      if (event.button !== 0 && event.button !== 1) return;
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!target) return;
      const url = new URL(target.href, location.href);
      if (url.origin !== location.origin) return;
      const match = url.pathname.match(/^\/perfumes\/([^/]+)\/?$/);
      if (!match) return;
      try {
        let session = sessionStorage.getItem("beecah:click-session");
        if (!session) {
          session = crypto.randomUUID();
          sessionStorage.setItem("beecah:click-session", session);
        }
        void fetch("/api/analytics/product-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: decodeURIComponent(match[1]), session }),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    }
    document.addEventListener("click", track);
    document.addEventListener("auxclick", track);
    return () => {
      document.removeEventListener("click", track);
      document.removeEventListener("auxclick", track);
    };
  }, []);
  return null;
}
