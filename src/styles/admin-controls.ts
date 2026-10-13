const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl! border border-transparent px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-45";
export const adminControls = {
  primary:
    base + " bg-neutral-200! text-neutral-950! hover:bg-white! [&_svg]:text-neutral-950!",
  secondary:
    base +
    " border-neutral-700! bg-neutral-900! text-neutral-100! hover:bg-neutral-800! [&_svg]:text-neutral-100!",
  danger:
    base +
    " border-[#593d43]! bg-[#281e23]! text-[#f0c5ca]! hover:bg-[#39252c]! [&_svg]:text-[#f0c5ca]!",
} as const;
