import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { Sparkle } from "lucide-react";
import { authVisualContent } from "@/src/content/auth-visual";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: "400",
  style: "normal",
  display: "swap",
});

export default function AuthVideoCaption() {
  return (
    <div className="absolute inset-x-0 bottom-0 p-6 text-white lg:p-8">
      <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/80">
        {authVisualContent.eyebrow}
      </p>
      <h2
        className={
          playfair.className +
          " mt-3 text-[clamp(32px,3.2vw,46px)] font-normal leading-[1.03] tracking-[-0.04em]"
        }
      >
        {authVisualContent.title}
        <br />
        <span className="font-['Bagind',serif] not-italic">
          {authVisualContent.accent}
        </span>
      </h2>
      <p className="mt-3 max-w-64 text-xs leading-5 text-white/85">
        {authVisualContent.description}
      </p>
      <Link
        href="/perfumes"
        className="mt-3 inline-flex min-h-11 items-center gap-2 text-[11px] underline decoration-white/50 underline-offset-4 transition-colors hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        <Sparkle size={13} fill="currentColor" aria-hidden="true" />
        {authVisualContent.action}
      </Link>
    </div>
  );
}
