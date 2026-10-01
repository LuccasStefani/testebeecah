// Tailwind utilities grouped by component. Keep the marker class for descendant variants.
export const footerStyles = {
  beecahFooter: [
    "beecah-footer pt-4 pr-3 pb-3 pl-3 bg-white text-white [&_a:hover]:text-white",
    "[&_a:hover]:underline [&_a:hover]:[text-underline-offset:5px]",
    "[&_a:focus-visible]:[outline:2px_solid_white] [&_a:focus-visible]:[outline-offset:5px]",
  ].join(" "),
  footerInner: [
    "footer-inner max-w-360 mt-auto mr-auto mb-auto ml-auto rounded-[24px] bg-[#182238]",
    "pt-[54px] pr-12 pb-6 pl-12 [@media(max-width:850px)]:pt-8",
    "[@media(max-width:850px)]:pr-[26px] [@media(max-width:850px)]:pb-6",
    "[@media(max-width:850px)]:pl-[26px] [@media(max-width:420px)]:pt-7",
    "[@media(max-width:420px)]:pr-5 [@media(max-width:420px)]:pb-7",
    "[@media(max-width:420px)]:pl-5",
  ].join(" "),
  footerTop: [
    "footer-top grid grid-cols-[1.4fr_repeat(3,1fr)] gap-10 [&_nav]:flex [&_nav]:flex-col",
    "[&_nav]:[align-items:flex-start] [&_nav]:gap-4 [&_nav]:pt-[18px] [&_nav_h2]:text-[11px]",
    "[&_nav_h2]:tracking-[.12em] [&_nav_h2]:uppercase [&_nav_h2]:mb-[10px] [&_nav_h2]:text-white",
    "[&_nav_a]:text-[#c1c7d1] [&_nav_a]:text-[13px] [&_nav_a]:leading-[1.5]",
    "[@media(max-width:850px)]:grid-cols-[repeat(2,1fr)] [@media(max-width:850px)]:gap-[30px]",
    "[@media(max-width:420px)]:gap-[24px_14px] [@media(max-width:420px)]:[&_nav_a]:text-[12px]",
  ].join(" "),
  footerBrand: [
    "footer-brand [&_img]:[filter:invert(1)] [&_img]:[mix-blend-mode:screen] [&_img]:w-[145px]",
    "[&_img]:h-auto [&_p]:text-[13px] [&_p]:leading-[1.8] [&_p]:text-[#c1c7d1] [&_p]:mt-[15px]",
    "[&_p]:mr-0 [&_p]:mb-[22px] [&_p]:ml-0 [&>a]:inline-flex [&>a]:items-center [&>a]:gap-3",
    "[&>a]:text-[12px]",
  ].join(" "),
  footerSignature: [
    'footer-signature [font-family:"Sorts_Mill_Goudy",serif] italic',
    "text-[clamp(32px,5.5vw,76px)] tracking-[-.04em] pt-13 pr-0 pb-[30px] pl-0 text-[#edf0f5]",
    "[@media(max-width:420px)]:pt-9",
  ].join(" "),
  footerBottom: [
    "footer-bottom flex justify-between gap-5 [border-top:1px_solid_#ffffff26] pt-[23px]",
    "text-[11px] text-[#b3bdce] [&>div]:flex [&>div]:flex-wrap [&>div]:gap-[22px]",
    "[@media(max-width:850px)]:flex-col [@media(max-width:420px)]:[&>div]:gap-4",
  ].join(" "),
} as const satisfies Record<string, string>;
