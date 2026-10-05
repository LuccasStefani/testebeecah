const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl! border border-transparent px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-45";
export const adminControls = {
  primary: base + " bg-[#2d416f]! text-white! hover:bg-[#3b5487]! [&_svg]:text-white!",
  secondary:
    base +
    " border-[#343842]! bg-[#191c22]! text-[#e4e7ed]! hover:bg-[#252a34]! [&_svg]:text-[#e4e7ed]!",
  danger:
    base +
    " border-[#593d43]! bg-[#281e23]! text-[#f0c5ca]! hover:bg-[#39252c]! [&_svg]:text-[#f0c5ca]!",
} as const;
