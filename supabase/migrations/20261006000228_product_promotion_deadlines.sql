alter table public.products add column promo_ends_on date;
comment on column public.products.promo_ends_on is 'Último dia da promoção, inclusive, no horário de Brasília. Nulo mantém ofertas sem prazo.';

create or replace function public.prepare_whatsapp_order(p_user_id uuid)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_items jsonb;
  v_fingerprint text;
  v_id uuid;
  v_subtotal numeric;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  if not exists (select 1 from public.cart_items where user_id=p_user_id) then
    raise exception 'Sua sacola está vazia.';
  end if;
  if exists (
    select 1 from public.cart_items c left join public.products p on p.id=c.product_id
    where c.user_id=p_user_id and (p.id is null or not p.active or c.quantity <= 0
      or c.quantity > p.stock or coalesce((case when p.promo_price >= 0 and p.promo_price < p.price and (p.promo_ends_on is null or p.promo_ends_on >= (now() at time zone 'America/Sao_Paulo')::date) then p.promo_price else p.price end),0) <= 0)
  ) then raise exception 'Revise os produtos e as quantidades da sacola.'; end if;

  select jsonb_agg(jsonb_build_object(
      'product_id',p.id,'product_name',p.name,'quantity',c.quantity,
      'unit_price',round((case when p.promo_price >= 0 and p.promo_price < p.price and (p.promo_ends_on is null or p.promo_ends_on >= (now() at time zone 'America/Sao_Paulo')::date) then p.promo_price else p.price end),2),
      'subtotal',round((case when p.promo_price >= 0 and p.promo_price < p.price and (p.promo_ends_on is null or p.promo_ends_on >= (now() at time zone 'America/Sao_Paulo')::date) then p.promo_price else p.price end),2)*c.quantity,
      'weight',p.weight,'width',p.width,'height',p.height,'length',p.length
    ) order by p.id),
    sum(round((case when p.promo_price >= 0 and p.promo_price < p.price and (p.promo_ends_on is null or p.promo_ends_on >= (now() at time zone 'America/Sao_Paulo')::date) then p.promo_price else p.price end),2)*c.quantity)
  into v_items,v_subtotal
  from public.cart_items c join public.products p on p.id=c.product_id where c.user_id=p_user_id;
  v_fingerprint := md5(v_items::text);
  select id into v_id from public.orders
    where user_id=p_user_id and checkout_channel='whatsapp' and status='pending'
      and checkout_fingerprint=v_fingerprint and expires_at>now()
    order by created_at desc limit 1;
  if v_id is not null then return v_id; end if;

  insert into public.orders(user_id,status,subtotal,total,shipping_price,checkout_channel,checkout_fingerprint,expires_at)
  values(p_user_id,'pending',v_subtotal,v_subtotal,null,'whatsapp',v_fingerprint,now()+interval '7 days')
  returning id into v_id;
  insert into public.order_items(order_id,product_id,product_name,unit_price,quantity,subtotal,weight,width,height,length)
  select v_id,x.product_id,x.product_name,x.unit_price,x.quantity,x.subtotal,x.weight,x.width,x.height,x.length
  from jsonb_to_recordset(v_items) as x(product_id uuid,product_name text,unit_price numeric,quantity integer,subtotal numeric,weight numeric,width numeric,height numeric,length numeric);
  return v_id;
end;
$$;
revoke all on function public.prepare_whatsapp_order(uuid) from public,anon,authenticated;
grant execute on function public.prepare_whatsapp_order(uuid) to service_role;
