import { Check } from "lucide-react";
import { assistedCheckoutContent as content } from "@/src/content/assisted-checkout";

export default function CheckoutSteps({
  current,
  complete = false,
}: {
  current: 1 | 2 | 3;
  complete?: boolean;
}) {
  return (
    <ol
      aria-label="Etapas da compra"
      className="flex items-center rounded-2xl bg-[#f4f3ef] p-2"
    >
      {content.steps.map((label, index) => {
        const step = index + 1;
        const done = complete || step < current;
        const active = step === current;
        return (
          <li
            key={label}
            aria-current={active && !complete ? "step" : undefined}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-[11px] font-medium sm:gap-2.5 sm:px-3 sm:text-sm ${active || complete ? "bg-white text-[#171914] shadow-sm" : "text-neutral-500"}`}
          >
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] sm:size-7 sm:text-xs ${done || active ? "bg-[#171914] text-white" : "bg-black/5"}`}
            >
              {done ? <Check size={13} aria-label="Concluída" /> : step}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
