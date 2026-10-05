revoke execute on function public.process_order_stock(uuid) from public, anon, authenticated;
grant execute on function public.process_order_stock(uuid) to service_role;
