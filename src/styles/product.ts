// Tailwind utilities grouped by component. Keep the marker class for descendant variants.
export const productStyles = {
  productBreadcrumb: [
    "product-breadcrumb flex items-center flex-wrap gap-3 text-[11px] text-[#888] pb-6",
    "[&_a]:min-h-8 [&_a]:[align-content:center] [&_[aria-current]]:text-[#333]",
    "[@media(max-width:767px)]:pb-[15px]",
  ].join(" "),
  productLayout: [
    "product-layout grid grid-cols-[1.05fr_1fr] items-start",
    "[@media(max-width:767px)]:grid-cols-[1fr] gap-12 [@media(max-width:767px)]:gap-3",
  ].join(" "),
  productVisual: [
    "product-visual sticky top-[115px] [@media(max-width:767px)]:static",
  ].join(" "),
  productPhotoNote: [
    "product-photo-note text-center text-[10px] text-[#8a8784] mt-[15px]",
    "[@media(max-width:767px)]:mt-[10px] hidden",
  ].join(" "),
  productBrand: [
    "product-brand uppercase tracking-[.2em] text-[10px] text-[#78777d]",
  ].join(" "),
  productBuyPanel: [
    "product-buy-panel [&_h1]:leading-[1.15] [&_h1]:wrap-anywhere bg-white pt-[26px] pr-4",
    'pb-[26px] pl-4 rounded-none [&_h1]:[font-family:"Sorts_Mill_Goudy",serif] [&_h1]:italic',
    "[&_h1]:font-normal [&_h1]:text-[clamp(38px,4.5vw,60px)] [&_h1]:tracking-[-.035em]",
    "[&_h1]:mt-[15px] [&_h1]:mr-0 [&_h1]:mb-[22px] [&_h1]:ml-0 [@media(max-width:767px)]:pt-5",
    "[@media(max-width:767px)]:pr-1 [@media(max-width:767px)]:pb-5",
    "[@media(max-width:767px)]:pl-1 [@media(max-width:767px)]:[&_h1]:text-[40px]",
  ].join(" "),
  productTags: [
    "product-tags flex gap-[7px] flex-wrap [&>span]:text-[#666] [&>span]:bg-[#f3f3f1]",
    "[&>span]:rounded-[8px] [&>span]:pt-2 [&>span]:pr-3 [&>span]:pb-2 [&>span]:pl-3",
    "[&>span]:text-[10px]",
  ].join(" "),
  productPriceBox: [
    "product-price-box flex gap-[18px] items-center mt-7 pt-6 [border-top:1px_solid_#eceae7]",
  ].join(" "),
  productPrice: [
    'product-price tracking-[-.035em] [font-family:"Sorts_Mill_Goudy",serif] text-[38px]',
    "font-normal [@media(max-width:767px)]:text-[34px]",
  ].join(" "),
  productOldPrice: [
    "product-old-price text-[13px] text-[#999] line-through mb-[3px]",
  ].join(" "),
  productDiscount: [
    "product-discount pt-[7px] pr-3 pb-[7px] pl-3 bg-[#1e1e1e] text-white rounded-[8px]",
    "text-[11px]",
  ].join(" "),
  productAvailability: [
    'product-availability mt-3 [&:before]:content-[""] [&:before]:inline-block',
    "[&:before]:w-[6px] [&:before]:h-[6px] [&:before]:rounded-full [&:before]:mr-[7px]",
    "[&.unavailable]:text-[#a56661] text-[#686868] text-[11px] [&:before]:bg-[#77967d]",
    "[&.unavailable:before]:bg-[#a56661]",
  ].join(" "),
  productService: [
    "product-service grid mt-[25px] [border-top:1px_solid_#e5e2dd] [&_span]:text-[12px]",
    "[&_span]:font-medium [&_p]:text-[11px] [&_p]:leading-[1.8] [&_p]:text-[#777] [&_p]:block",
    "[&_p]:mt-[5px] [&_a]:text-[11px] [&_a]:leading-[1.8] [&_a]:block [&_a]:mt-[5px]",
    "[&_a]:underline [&_a]:[text-underline-offset:4px] bg-[#f5f5f3] [border:0] rounded-[16px]",
    "pt-5 pr-5 pb-5 pl-5 grid-cols-[1fr_1fr] gap-5 [&_a]:text-[#1e1e1e]",
    "[@media(max-width:767px)]:grid-cols-[1fr] [@media(max-width:767px)]:gap-4",
  ].join(" "),
  productStory: [
    "product-story grid grid-cols-[1fr_1fr] gap-9 mt-12 [&>section]:pt-[30px] [&>section]:pr-3",
    "[&>section]:pb-[30px] [&>section]:pl-3 [&_h2]:tracking-[-.035em] [&_h2]:leading-[1.3]",
    "[&_h2]:mt-[15px] [&_h2]:mr-0 [&_h2]:mb-[22px] [&_h2]:ml-0 [&_.product-notes]:pt-[30px]",
    "[&_.product-notes]:pr-[30px] [&_.product-notes]:pb-[30px] [&_.product-notes]:pl-[30px]",
    "[@media(max-width:900px)]:gap-5 [@media(max-width:900px)]:[&_.product-notes]:pt-6",
    "[@media(max-width:900px)]:[&_.product-notes]:pr-6",
    "[@media(max-width:900px)]:[&_.product-notes]:pb-6",
    "[@media(max-width:900px)]:[&_.product-notes]:pl-6 [@media(max-width:767px)]:grid-cols-[1fr]",
    "[@media(max-width:767px)]:mt-[18px] [@media(max-width:767px)]:gap-3",
    "[@media(max-width:767px)]:[&>section]:pt-6 [@media(max-width:767px)]:[&>section]:pr-[10px]",
    "[@media(max-width:767px)]:[&>section]:pb-6 [@media(max-width:767px)]:[&>section]:pl-[10px]",
    "[&_.product-notes]:bg-[#f5f5f3] [&_.product-notes]:rounded-[16px]",
    '[&_h2]:[font-family:"Sorts_Mill_Goudy",serif] [&_h2]:italic [&_h2]:text-[34px]',
    "[&_h2]:font-normal [&_h2_.font-haerins]:not-italic [border-top:1px_solid_#e9e7e4] pt-4",
    "[@media(max-width:767px)]:[&_h2]:text-[30px]",
  ].join(" "),
  productDescription: [
    "product-description text-[14px] leading-[1.9] text-[#777] whitespace-pre-line",
  ].join(" "),
  productBack: [
    "product-back inline-flex min-h-11 items-center mt-[22px] text-[12px] text-[#1e1e1e]",
  ].join(" "),
  productNoteGroup: [
    "product-note-group flex gap-[15px] pt-5 pr-0 pb-5 pl-0 [border-top:1px_solid_#dfe3eb]",
    "[&_h3]:text-[14px] [&_small]:block [&_small]:text-[10px] [&_small]:text-[#8b919a]",
    "[&_small]:mt-1 [&_small]:mr-0 [&_small]:mb-3 [&_small]:ml-0 border-[#e5e4e0]",
    "[&_.product-tags>span]:bg-white",
  ].join(" "),
  productNoteNumber: ["product-note-number text-[11px] text-[#8791a3] pt-[3px]"].join(
    " ",
  ),
  productGallery: [
    "product-gallery [&_button[aria-pressed=true]]:shadow-[0_0_0_2px_#2d416f]",
    "[&_button[aria-pressed=true]]:border-white [&_button]:mt-[3px] [&_button]:mr-[3px]",
    "[&_button]:mb-[3px] [&_button]:ml-[3px] [&_button:first-child]:ml-[3px]",
    "[@media(max-width:767px)]:[&>div:first-child]:max-h-[65dvh]",
    "[@media(max-width:767px)]:[&>div:first-child]:[aspect-ratio:1]",
    "[&>div:first-child]:rounded-[16px]! [&>div:first-child]:bg-[#f3f2f0]!",
  ].join(" "),
  productDetail: ["product-detail px-4"].join(" "),
  productActions: ["product-actions mt-[26px]"].join(" "),
  productQuantityRow: [
    "product-quantity-row flex justify-between items-center gap-4 [&>span]:text-[11px]",
    "[&>span]:uppercase [&>span]:tracking-[.1em] [&>span]:text-[#777]",
  ].join(" "),
  productStepper: [
    "product-stepper flex items-center gap-1 bg-[#f3f3f1] pt-1 pr-1 pb-1 pl-1 rounded-[12px]",
    "[&_button]:w-11 [&_button]:h-11 [&_button]:grid [&_button]:place-items-center",
    "[&_button]:bg-[#1e1e1e] [&_button]:text-white [&_button]:rounded-[8px]",
    "[&_button]:[transition:background_.2s] [&_button:hover]:bg-[#2d416f]",
    "[&_button:disabled]:bg-[#e5e5e3] [&_button:disabled]:text-[#999]",
    "[&_button:disabled]:cursor-not-allowed [&>span]:min-w-8 [&>span]:text-center",
    "[&>span]:text-[13px]",
  ].join(" "),
  productPurchaseButtons: ["product-purchase-buttons flex gap-[10px] mt-5"].join(" "),
  productAddButton: [
    "product-add-button min-h-14 flex-1 flex justify-center items-center gap-3 bg-[#1e1e1e]",
    "text-white rounded-[12px] pt-4 pr-5 pb-4 pl-5 text-[12px] font-medium tracking-[.025em]",
    "uppercase [transition:background_.2s] [&:hover]:bg-[#2d416f] [&:disabled]:opacity-[.5]",
    "[&:disabled]:cursor-not-allowed [@media(max-width:767px)]:text-[11px]",
    "[@media(max-width:767px)]:pt-[14px] [@media(max-width:767px)]:pr-3",
    "[@media(max-width:767px)]:pb-[14px] [@media(max-width:767px)]:pl-3",
    "[@media(max-width:767px)]:gap-2 [@media(max-width:767px)]:[&>svg:last-child]:hidden",
  ].join(" "),
  productFavoriteButton: [
    "product-favorite-button w-14 min-h-14 shrink-0 grid place-items-center bg-[#f3f3f1]",
    "rounded-[12px] text-[#1e1e1e] [transition:background_.2s] [&:hover]:bg-[#e9e9e6]",
    "[&[aria-pressed=true]]:bg-[#1e1e1e] [&[aria-pressed=true]]:text-white",
    "[&:disabled]:opacity-[.5]",
  ].join(" "),
  productActionHint: ["product-action-hint text-[10px] text-[#888] mt-3"].join(" "),
  productActionStatus: [
    "product-action-status text-[12px] text-[#2d416f] mt-3 [&:empty]:hidden",
  ].join(" "),
  productViewBag: [
    "product-view-bag inline-flex items-center gap-3 min-h-11 text-[12px] mt-2 underline",
    "[text-underline-offset:4px]",
  ].join(" "),
} as const satisfies Record<string, string>;
