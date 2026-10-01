/** Static interface copy. Product names and account/order data remain in the database. */
export type ContentDictionary = Readonly<Record<string, string>>;
export type NavigationItem = Readonly<{ label: string; href: string }>;
export type TestimonialContent = Readonly<{
  id: string;
  text: string;
  author: string;
  rating?: number;
}>;
