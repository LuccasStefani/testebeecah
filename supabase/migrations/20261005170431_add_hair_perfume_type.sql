alter table public.products drop constraint products_product_type_check;
alter table public.products add constraint products_product_type_check
  check (product_type in ('perfume', 'body-splash', 'decant', 'hair-perfume', 'body-cream', 'skin-cream'));
comment on column public.products.product_type is 'Product format: perfume, body splash, decant, hair perfume, body cream or skin cream. Independent from gender, Arabian origin and new arrivals.';
