import type { ProductType } from "@/src/content/product-types";

export type Product = {
  id: string;
  name: string;
  slug: string;
  brand: string;

  description: string;

  price: number;
  promoPrice?: number;
  promoEndsOn?: string | null;

  stock: number;

  category: string;
  productType?: ProductType;
  isArabian?: boolean;
  isNew?: boolean;

  volume?: string;
  fragranceFamily?: string;

  topNotes?: string[];
  heartNotes?: string[];
  baseNotes?: string[];

  imageUrl: string;
  images?: string[];

  featured?: boolean;
  active?: boolean;
};
