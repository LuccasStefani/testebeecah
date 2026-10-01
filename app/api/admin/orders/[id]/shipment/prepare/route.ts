import { NextResponse } from "next/server";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import { supabaseAdmin } from "@/src/lib/supabase/admin";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteProps) {
  try {
    /*
     * 1. Somente administradores podem preparar envios.
     */
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        },
      );
    }

    const { id: orderId } = await params;

    /*
     * 2. Carrega o pedido.
     *
     * Nesta etapa usamos apenas dados congelados no pedido.
     * Não usamos carrinho, endereço atual do cliente
     * ou dados atuais do produto.
     */
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(
        `
        id,
        status,
        shipping_service_id,
        shipping_service_name,
        shipping_company_id,
        shipping_company_name
      `,
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error("Erro ao buscar pedido para envio:", orderError);

      return NextResponse.json(
        {
          success: false,
          message: "Não foi possível consultar o pedido.",
        },
        { status: 500 },
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Pedido não encontrado.",
        },
        { status: 404 },
      );
    }

    /*
     * 3. Somente pedidos pagos/aprovados podem
     * entrar no fluxo de expedição.
     */
    if (order.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Somente pedidos com pagamento aprovado podem ser preparados para envio.",
        },
        { status: 409 },
      );
    }

    /*
     * 4. O serviço de frete precisa estar congelado
     * no próprio pedido.
     */
    if (
      order.shipping_service_id === null ||
      order.shipping_service_id === undefined ||
      order.shipping_company_id === null ||
      order.shipping_company_id === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "O pedido não possui uma modalidade de frete válida.",
        },
        { status: 409 },
      );
    }

    /*
     * 5. Carrega o endereço congelado no checkout.
     */
    const { data: shippingAddress, error: shippingAddressError } = await supabaseAdmin
      .from("order_shipping_addresses")
      .select(
        `
        id,
        recipient_name,
        recipient_document,
        recipient_email,
        phone,
        zip_code,
        street,
        number,
        complement,
        neighborhood,
        city,
        state
      `,
      )
      .eq("order_id", orderId)
      .maybeSingle();

    if (shippingAddressError) {
      console.error("Erro ao buscar endereço do pedido:", shippingAddressError);

      return NextResponse.json(
        {
          success: false,
          message: "Não foi possível consultar o endereço de entrega.",
        },
        { status: 500 },
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        {
          success: false,
          message: "O pedido não possui endereço de entrega congelado.",
        },
        { status: 409 },
      );
    }

    const addressComplete =
      Boolean(shippingAddress.recipient_name?.trim()) &&
      Boolean(shippingAddress.recipient_document?.trim()) &&
      Boolean(shippingAddress.recipient_email?.trim()) &&
      Boolean(shippingAddress.phone?.trim()) &&
      Boolean(shippingAddress.zip_code?.trim()) &&
      Boolean(shippingAddress.street?.trim()) &&
      Boolean(shippingAddress.number?.trim()) &&
      Boolean(shippingAddress.neighborhood?.trim()) &&
      Boolean(shippingAddress.city?.trim()) &&
      Boolean(shippingAddress.state?.trim());

    if (!addressComplete) {
      return NextResponse.json(
        {
          success: false,
          message: "Os dados congelados do destinatário estão incompletos.",
        },
        { status: 409 },
      );
    }

    /*
     * 6. Carrega os pacotes calculados no checkout.
     */
    const { data: packages, error: packagesError } = await supabaseAdmin
      .from("order_shipping_packages")
      .select(
        `
        id,
        package_index,
        weight,
        width,
        height,
        length,
        insurance_value,
        products
      `,
      )
      .eq("order_id", orderId)
      .order("package_index", {
        ascending: true,
      });

    if (packagesError) {
      console.error("Erro ao buscar pacotes do pedido:", packagesError);

      return NextResponse.json(
        {
          success: false,
          message: "Não foi possível consultar os pacotes do pedido.",
        },
        { status: 500 },
      );
    }

    if (!packages || packages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "O pedido não possui pacotes de envio congelados.",
        },
        { status: 409 },
      );
    }

    /*
     * 7. Confere se algum desses pacotes já está
     * ligado a um shipment.
     *
     * Essa proteção será importante para impedir
     * geração duplicada de etiquetas.
     */
    const packageIds = packages.map((shippingPackage) => shippingPackage.id);

    const { data: existingPackageShipment, error: existingPackageShipmentError } =
      await supabaseAdmin
        .from("order_shipment_packages")
        .select(
          `
        id,
        shipment_id,
        package_id
      `,
        )
        .in("package_id", packageIds)
        .limit(1)
        .maybeSingle();

    if (existingPackageShipmentError) {
      console.error(
        "Erro ao verificar pacote já preparado:",
        existingPackageShipmentError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Não foi possível verificar o estado atual do envio.",
        },
        { status: 500 },
      );
    }

    if (existingPackageShipment) {
      return NextResponse.json(
        {
          success: false,
          message: "Um ou mais pacotes deste pedido já possuem um envio preparado.",
        },
        { status: 409 },
      );
    }

    /*
     * 8. Proteção adicional:
     * verifica se existe shipment do pedido que,
     * por alguma falha anterior, não tenha sido
     * relacionado ao pacote.
     */
    const { data: existingShipment, error: existingShipmentError } = await supabaseAdmin
      .from("order_shipments")
      .select(
        `
        id,
        status,
        provider_shipment_id
      `,
      )
      .eq("order_id", orderId)
      .eq("provider", "melhor_envio")
      .limit(1)
      .maybeSingle();

    if (existingShipmentError) {
      console.error("Erro ao verificar envio existente:", existingShipmentError);

      return NextResponse.json(
        {
          success: false,
          message: "Não foi possível verificar envios existentes.",
        },
        { status: 500 },
      );
    }

    if (existingShipment) {
      return NextResponse.json(
        {
          success: false,
          message: "Este pedido já possui um envio do Melhor Envio registrado.",
        },
        { status: 409 },
      );
    }

    /*
     * 9. Confere o remetente ativo.
     *
     * Não retornamos os dados pessoais do remetente
     * nessa resposta.
     */
    const { data: sender, error: senderError } = await supabaseAdmin
      .from("shipping_senders")
      .select("id")
      .eq("active", true)
      .maybeSingle();

    if (senderError) {
      console.error("Erro ao buscar remetente ativo:", senderError);

      return NextResponse.json(
        {
          success: false,
          message: "Não foi possível consultar o remetente.",
        },
        { status: 500 },
      );
    }

    if (!sender) {
      return NextResponse.json(
        {
          success: false,
          message: "Nenhum remetente ativo está configurado.",
        },
        { status: 409 },
      );
    }

    /*
     * Por enquanto paramos aqui.
     *
     * Nenhum shipment é criado e nenhuma chamada
     * ao Melhor Envio é feita nesta versão.
     */
    return NextResponse.json({
      success: true,
      readyToPrepare: true,
      message: "Pedido validado e pronto para ser preparado para envio.",
      orderId: order.id,
      packagesCount: packages.length,
      shipping: {
        serviceId: order.shipping_service_id,
        serviceName: order.shipping_service_name,
        companyId: order.shipping_company_id,
        companyName: order.shipping_company_name,
      },
    });
  } catch (error) {
    console.error("Erro ao preparar envio do pedido:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro interno ao preparar o envio.",
      },
      { status: 500 },
    );
  }
}
