"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import {
  consentSnapshot,
  OPEN_CONSENT_EVENT,
  parseConsent,
  saveConsent,
  subscribeConsent,
} from "@/src/lib/cookie-consent";
import { privacyContent as content } from "@/src/content/privacy";

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
      className="min-h-11 text-left hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      {content.preferences}
    </button>
  );
}

export default function CookieConsent() {
  const raw = useSyncExternalStore(subscribeConsent, consentSnapshot, () => null);
  const [opened, setOpened] = useState(false);
  const choice = parseConsent(raw);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!opened) return;
    const previous = document.activeElement;
    panel.current?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [opened]);
  useEffect(() => {
    const open = () => setOpened(true);
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);
  if (choice && !opened) return null;
  const choose = (analytics: boolean) => {
    saveConsent(analytics);
    setOpened(false);
  };
  return (
    <section
      ref={panel}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape" && choice) setOpened(false);
      }}
      aria-labelledby="privacy-title"
      data-cookie-consent
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[80] mx-auto max-h-[calc(100dvh-32px)] max-w-xl overflow-y-auto overscroll-contain rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-xl sm:inset-x-auto sm:bottom-5 sm:left-5 sm:p-6"
      data-lenis-prevent
    >
      <div className="flex items-center gap-2">
        <Cookie size={18} aria-hidden="true" />
        <h2 id="privacy-title" className="text-base font-medium">
          {content.title}
        </h2>
        {choice && (
          <button
            type="button"
            aria-label="Fechar preferências"
            onClick={() => setOpened(false)}
            className="ml-auto flex size-11 items-center justify-center"
          >
            <X size={18} />
          </button>
        )}
      </div>
      <p className="mt-3 text-xs leading-5 text-neutral-600">
        {content.description}{" "}
        <Link href="/politica-de-privacidade" className="underline underline-offset-2">
          {content.policy}
        </Link>
      </p>
      <div className="mt-4 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
        <button
          type="button"
          onClick={() => choose(false)}
          className="min-h-11 rounded-xl border border-neutral-300 px-4 text-xs font-medium hover:bg-neutral-100"
        >
          {content.reject}
        </button>
        <button
          type="button"
          onClick={() => choose(true)}
          className="min-h-11 rounded-xl bg-[#171914] px-4 text-xs font-medium text-white hover:bg-[#2d416f]"
        >
          {content.accept}
        </button>
      </div>
    </section>
  );
}
