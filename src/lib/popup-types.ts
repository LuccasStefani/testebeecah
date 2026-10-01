export type PopupBanner = {
  id: string;
  productId: string;
  title: string;
  description: string;
  imageUrl: string;
  active: boolean;
  pinned: boolean;
};
export type PopupConfig = {
  enabled: boolean;
  mode: "fixed" | "slides";
  banners: PopupBanner[];
};
export type PopupSlide = {
  id: string;
  title: string;
  description: string;
  image: string;
  name: string;
  href: string;
  price: number;
  promoPrice: number;
};
