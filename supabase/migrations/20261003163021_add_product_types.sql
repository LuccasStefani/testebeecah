-- Product format is independent from gender, Arabian origin and new arrivals.
alter table public.products
  add column if not exists product_type text not null default 'perfume'
  constraint products_product_type_check check (product_type in ('perfume', 'body-splash', 'decant'));

comment on column public.products.product_type is 'Product format: perfume, body splash or decant. Independent from category and is_arabian.';
