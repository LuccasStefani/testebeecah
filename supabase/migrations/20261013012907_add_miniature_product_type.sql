alter table public.products drop constraint products_product_type_check;
alter table public.products add constraint products_product_type_check check (product_type in ('perfume','body-splash','decant','hair-perfume','body-cream','skin-cream','miniature'));
