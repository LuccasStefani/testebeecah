export type Product = {
  id: string;
  name: string;
  slug: string;
  brand: string;

  description: string;

  price: number;
  promoPrice?: number;

  stock: number;

  category: string;

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