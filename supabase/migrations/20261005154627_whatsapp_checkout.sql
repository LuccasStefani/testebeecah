
alter table public.orders
  add column checkout_channel text not null default 'online' check (checkout_channel in ('online', 'whatsapp')),
  add column checkout_fingerprint text,
  add column checkout_payment_url text,
  add column checkout_payment_started_at timestamptz,
  add column checkout_shipping_locked boolean not null default false;

create index orders_whatsapp_pending on public.orders(user_id, checkout_fingerprint)
  where checkout_channel = 'whatsapp' and status = 'pending';

-- Called only by the authenticated server handler, using its verified user ID.
create function public.prepare_whatsapp_order(p_user_id uuid)
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
      or c.quantity > p.stock or coalesce(p.promo_price,p.price,0) <= 0)
  ) then raise exception 'Revise os produtos e as quantidades da sacola.'; end if;

  select jsonb_agg(jsonb_build_object(
      'product_id',p.id,'product_name',p.name,'quantity',c.quantity,
      'unit_price',round(coalesce(p.promo_price,p.price),2),
      'subtotal',round(coalesce(p.promo_price,p.price),2)*c.quantity,
      'weight',p.weight,'width',p.width,'height',p.height,'length',p.length
    ) order by p.id),
    sum(round(coalesce(p.promo_price,p.price),2)*c.quantity)
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
