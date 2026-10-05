import { redirect } from "next/navigation";
import OrderReceipt from "@/src/components/checkout/OrderReceipt";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ external_reference?: string }>;
}) {
  const { external_reference } = await searchParams;
  if (external_reference && /^[0-9a-f-]{36}$/i.test(external_reference))
    redirect(`/checkout/pedido/${external_reference}`);
  return <OrderReceipt order={null} />;
}
