export function getLoginReturnPath(next: string | null): string {
  if (next === "/carrinho") return next;
  if (next && /^\/checkout\/pedido\/[0-9a-f-]{36}$/i.test(next)) return next;
  return "/auth/continue";
}
