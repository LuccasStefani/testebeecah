import { Preference } from "mercadopago";
import { NextResponse } from "next/server";

import {
  calculateShippingForUser,
} from "@/src/lib/melhor-envio/shipping";

import {
  mercadoPagoClient,
} from "@/src/lib/mercadopago/client";

import {
  supabaseAdmin,
} from "@/src/lib/supabase/admin";

import {
  createSupabaseServerClient,
} from "@/src/lib/supabase/server";

import {
  isValidCpf,
} from "@/src/lib/validation/cpf";

type CheckoutRequestBody = {
  addressId?: unknown;
  shippingServiceId?: unknown;
};

function money(value: number) {
  return Number(value.toFixed(2));
}

export async function POST(
  request: Request
) {
  let createdOrderId: string | null =
    null;

  /*
   * Indica se a preferência já chegou
   * a ser criada no Mercado Pago.
   *
   * Depois disso não apagamos o pedido
   * automaticamente, pois ele passa a
   * fazer parte do histórico financeiro.
   */
  let mercadoPagoPreferenceCreated =
    false;

  try {
    /*
     * 1. Autentica o usuário.
     */
    const supabase =
      await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Você precisa estar logado para finalizar a compra.",
        },
        {
          status: 401,
        }
      );
    }

    /*
 * 2. Valida os dados pessoais
 * diretamente no servidor.
 *
 * A validação do navegador melhora a
 * experiência, mas não é considerada
 * uma barreira de segurança.
 */
    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(`
    full_name,
    phone,
    cpf
  `)
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Erro ao carregar perfil no checkout:",
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível validar seus dados pessoais.",
        },
        {
          status: 500,
        }
      );
    }

    const profileComplete =
      Boolean(profile?.full_name?.trim()) &&
      Boolean(profile?.phone?.trim()) &&
      Boolean(profile?.cpf?.trim()) &&
      isValidCpf(profile?.cpf ?? "");

    if (!profileComplete || !profile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Complete seus dados pessoais, incluindo um CPF válido, antes de finalizar a compra.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 2. Recebe somente:
     *
     * - addressId
     * - shippingServiceId
     *
     * Não recebemos preço, frete,
     * produtos ou total do navegador.
     */
    const body =
      (await request.json()) as
      CheckoutRequestBody;

    const addressId =
      typeof body.addressId === "string"
        ? body.addressId.trim()
        : "";

    const shippingServiceId =
      Number(body.shippingServiceId);

    if (!addressId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selecione um endereço de entrega.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        shippingServiceId
      ) ||
      shippingServiceId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selecione uma modalidade de frete válida.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 3. Carrega o endereço completo
     * diretamente do banco e confirma
     * que pertence ao usuário.
     *
     * Estes dados serão copiados para
     * order_shipping_addresses.
     */
    const {
      data: address,
      error: addressError,
    } = await supabaseAdmin
      .from("addresses")
      .select(`
        id,
        user_id,
        recipient_name,
        phone,
        zip_code,
        street,
        number,
        complement,
        neighborhood,
        city,
        state
      `)
      .eq("id", addressId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (addressError) {
      console.error(
        "Erro ao carregar endereço no checkout:",
        addressError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível carregar o endereço de entrega.",
        },
        {
          status: 500,
        }
      );
    }

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Endereço de entrega não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * 4. Carrega o carrinho diretamente
     * do Supabase.
     */
    const {
      data: cartItems,
      error: cartError,
    } = await supabaseAdmin
      .from("cart_items")
      .select(`
        product_id,
        quantity
      `)
      .eq("user_id", user.id);

    if (cartError) {
      console.error(
        "Erro ao carregar carrinho no checkout:",
        cartError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível carregar o carrinho.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !cartItems ||
      cartItems.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Seu carrinho está vazio.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 5. Valida as quantidades do
     * carrinho salvo.
     */
    const invalidCartItem =
      cartItems.find(
        (item) =>
          !Number.isInteger(
            Number(item.quantity)
          ) ||
          Number(item.quantity) <= 0
      );

    if (invalidCartItem) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O carrinho possui uma quantidade inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const productIds =
      cartItems.map(
        (item) => item.product_id
      );

    /*
     * 6. Busca os produtos atuais.
     *
     * Preço e estoque vêm sempre
     * do servidor.
     */
    const {
      data: products,
      error: productsError,
    } = await supabaseAdmin
      .from("products")
      .select(`
        id,
        name,
        price,
        promo_price,
        stock,
        active
      `)
      .in("id", productIds)
      .eq("active", true);

    if (productsError) {
      console.error(
        "Erro ao carregar produtos no checkout:",
        productsError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível validar os produtos.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !products ||
      products.length !==
      productIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Um ou mais produtos não estão disponíveis.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 7. Recalcula cada item usando
     * preço e estoque atuais.
     */
    const checkoutItems =
      cartItems.map((cartItem) => {
        const product =
          products.find(
            (currentProduct) =>
              currentProduct.id ===
              cartItem.product_id
          );

        if (!product) {
          throw new Error(
            "Produto do carrinho não encontrado."
          );
        }

        const quantity =
          Number(cartItem.quantity);

        if (
          quantity >
          Number(product.stock)
        ) {
          throw new Error(
            `Estoque insuficiente para ${product.name}.`
          );
        }

        const regularPrice =
          Number(product.price);

        const promotionalPrice =
          product.promo_price !== null
            ? Number(
              product.promo_price
            )
            : null;

        const unitPrice =
          promotionalPrice !== null
            ? promotionalPrice
            : regularPrice;

        if (
          !Number.isFinite(unitPrice) ||
          unitPrice <= 0
        ) {
          throw new Error(
            `Preço inválido para ${product.name}.`
          );
        }

        const itemSubtotal =
          money(
            unitPrice * quantity
          );

        return {
          productId:
            product.id,

          name:
            product.name,

          unitPrice:
            money(unitPrice),

          quantity,

          subtotal:
            itemSubtotal,
        };
      });

    /*
     * 8. Calcula o subtotal dos
     * produtos no servidor.
     */
    const subtotal =
      money(
        checkoutItems.reduce(
          (sum, item) =>
            sum + item.subtotal,
          0
        )
      );

    if (
      !Number.isFinite(subtotal) ||
      subtotal <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O subtotal do pedido é inválido.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 9. Recalcula o frete diretamente
     * no Melhor Envio.
     *
     * Não usamos o preço exibido no
     * navegador.
     */
    const shippingResult =
      await calculateShippingForUser(
        user.id,
        addressId
      );

    /*
     * 10. Localiza, na nova cotação,
     * exatamente o serviço escolhido
     * pelo cliente.
     */
    const selectedShipping =
      shippingResult.quotes.find(
        (quote) =>
          quote.serviceId ===
          shippingServiceId
      );

    if (!selectedShipping) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A modalidade de frete selecionada não está mais disponível. Recalcule o frete.",
        },
        {
          status: 409,
        }
      );
    }

    const shippingPrice =
      money(
        selectedShipping.price
      );

    if (
      !Number.isFinite(
        shippingPrice
      ) ||
      shippingPrice < 0
    ) {
      throw new Error(
        "O valor do frete retornado é inválido."
      );
    }

    /*
     * 11. Total financeiro definitivo.
     */
    const total =
      money(
        subtotal +
        shippingPrice
      );

    if (
      !Number.isFinite(total) ||
      total <= 0
    ) {
      throw new Error(
        "O valor total do pedido é inválido."
      );
    }

    /*
     * 12. Define expiração da
     * preferência em 24 horas.
     */
    const expirationDate =
      new Date(
        Date.now() +
        24 * 60 * 60 * 1000
      );

    const expirationDateIso =
      expirationDate.toISOString();

    /*
     * 13. Cria o pedido com o snapshot
     * comercial do frete.
     */
    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id:
          user.id,

        status:
          "pending",

        expires_at:
          expirationDateIso,

        subtotal,

        shipping_price:
          shippingPrice,

        shipping_service_id:
          selectedShipping.serviceId,

        shipping_service_name:
          selectedShipping.serviceName,

        shipping_company_id:
          selectedShipping.companyId,

        shipping_company_name:
          selectedShipping.companyName,

        shipping_delivery_min:
          selectedShipping
            .deliveryRange
            .min,

        shipping_delivery_max:
          selectedShipping
            .deliveryRange
            .max,

        total,
      })
      .select(`
        id,
        user_id,
        status,
        subtotal,
        shipping_price,
        total
      `)
      .single();

    if (
      orderError ||
      !order
    ) {
      console.error(
        "Erro ao criar pedido:",
        orderError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível criar o pedido.",
        },
        {
          status: 500,
        }
      );
    }

    createdOrderId =
      order.id;

    /*
     * 14. Salva o snapshot dos
     * produtos comprados.
     */
    const orderItems =
      checkoutItems.map(
        (item) => ({
          order_id:
            order.id,

          product_id:
            item.productId,

          product_name:
            item.name,

          unit_price:
            item.unitPrice,

          quantity:
            item.quantity,

          subtotal:
            item.subtotal,
        })
      );

    const {
      error: orderItemsError,
    } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (orderItemsError) {
      console.error(
        "Erro ao criar itens do pedido:",
        orderItemsError
      );

      /*
       * order_items e endereço usam
       * ON DELETE CASCADE.
       */
      await supabaseAdmin
        .from("orders")
        .delete()
        .eq(
          "id",
          order.id
        );

      createdOrderId =
        null;

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível salvar os itens do pedido.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * 15. Cria o snapshot do endereço.
     *
     * Mesmo que o cliente altere ou
     * exclua o endereço posteriormente,
     * o pedido mantém exatamente os
     * dados usados na compra.
     */
    const {
      error:
      shippingAddressError,
    } = await supabaseAdmin
      .from(
        "order_shipping_addresses"
      )
      .insert({
        order_id:
          order.id,

        recipient_name:
          address.recipient_name,

        recipient_document:
          profile.cpf,

        phone:
          address.phone,

        zip_code:
          address.zip_code,

        street:
          address.street,

        number:
          address.number,

        complement:
          address.complement,

        neighborhood:
          address.neighborhood,

        city:
          address.city,

        state:
          address.state,
      });

    if (shippingAddressError) {
      console.error(
        "Erro ao salvar endereço do pedido:",
        shippingAddressError
      );

      /*
       * O delete do pedido também
       * remove order_items por cascade.
       */
      await supabaseAdmin
        .from("orders")
        .delete()
        .eq(
          "id",
          order.id
        );

      createdOrderId =
        null;

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível salvar o endereço de entrega do pedido.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * 16. Itens enviados ao
     * Mercado Pago.
     */
    const preferenceItems =
      checkoutItems.map(
        (item) => ({
          id:
            item.productId,

          title:
            item.name,

          quantity:
            item.quantity,

          unit_price:
            item.unitPrice,

          currency_id:
            "BRL",
        })
      );

    /*
     * O frete entra como um item
     * separado na preferência.
     *
     * Assim:
     *
     * produtos + frete =
     * exatamente orders.total
     */
    if (shippingPrice > 0) {
      preferenceItems.push({
        id:
          `shipping-${selectedShipping.serviceId}`,

        title:
          `Frete - ${selectedShipping.companyName} ${selectedShipping.serviceName}`,

        quantity:
          1,

        unit_price:
          shippingPrice,

        currency_id:
          "BRL",
      });
    }

    /*
     * 17. Origem usada nas URLs
     * de retorno do Mercado Pago.
     */
    const origin =
      process.env
        .NEXT_PUBLIC_SITE_URL ??
      new URL(request.url).origin;

    const preference =
      new Preference(
        mercadoPagoClient
      );

    /*
     * 18. Cria a preferência.
     *
     * external_reference = order.id
     *
     * Isso permite ao webhook encontrar
     * exatamente o pedido correto.
     */
    const result =
      await preference.create({
        body: {
          items:
            preferenceItems,

          expires:
            true,

          expiration_date_from:
            new Date().toISOString(),

          expiration_date_to:
            expirationDateIso,

          payer: {
            email:
              user.email ??
              undefined,
          },

          back_urls: {
            success:
              `${origin}/checkout/sucesso`,

            failure:
              `${origin}/checkout/erro`,

            pending:
              `${origin}/checkout/pendente`,
          },

          auto_return:
            "approved",

          external_reference:
            order.id,

          metadata: {
            order_id:
              order.id,

            user_id:
              user.id,

            shipping_service_id:
              selectedShipping
                .serviceId,

            shipping_company:
              selectedShipping
                .companyName,
          },
        },
      });

    if (!result.id) {
      throw new Error(
        "O Mercado Pago não retornou uma preferência válida."
      );
    }

    /*
     * A preferência já existe no
     * Mercado Pago a partir daqui.
     */
    mercadoPagoPreferenceCreated =
      true;

    /*
     * 19. Salva o ID da preferência
     * no pedido.
     */
    const {
      error:
      preferenceUpdateError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        mercado_pago_preference_id:
          result.id,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        order.id
      );

    if (preferenceUpdateError) {
      console.error(
        "Erro ao salvar preferência no pedido:",
        preferenceUpdateError
      );

      /*
       * A preferência já existe no
       * Mercado Pago.
       *
       * Portanto NÃO apagamos o pedido.
       * Mantemos os dados para auditoria
       * e recuperação.
       */
      return NextResponse.json(
        {
          success: false,
          message:
            "O pagamento foi preparado, mas não foi possível finalizar o registro do pedido.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * 20. Retorna os dados necessários
     * para o navegador abrir o
     * Mercado Pago.
     */
    return NextResponse.json({
      success: true,

      orderId:
        order.id,

      subtotal,

      shipping: {
        serviceId:
          selectedShipping
            .serviceId,

        serviceName:
          selectedShipping
            .serviceName,

        companyName:
          selectedShipping
            .companyName,

        price:
          shippingPrice,

        deliveryMin:
          selectedShipping
            .deliveryRange
            .min,

        deliveryMax:
          selectedShipping
            .deliveryRange
            .max,
      },

      total,

      preferenceId:
        result.id,

      initPoint:
        result.init_point,

      sandboxInitPoint:
        result.sandbox_init_point,
    });
  } catch (error) {
    console.error(
      "Erro ao criar checkout:",
      error
    );

    /*
     * Só apagamos automaticamente
     * quando:
     *
     * 1. o pedido foi criado;
     * 2. a preferência ainda NÃO foi
     *    criada no Mercado Pago.
     *
     * O CASCADE remove também:
     * - order_items
     * - order_shipping_addresses
     */
    if (
      createdOrderId &&
      !mercadoPagoPreferenceCreated
    ) {
      const {
        error: cleanupError,
      } = await supabaseAdmin
        .from("orders")
        .delete()
        .eq(
          "id",
          createdOrderId
        )
        .is(
          "mercado_pago_preference_id",
          null
        );

      if (cleanupError) {
        console.error(
          "Erro ao limpar pedido incompleto:",
          cleanupError
        );
      }
    }

    const message =
      error instanceof Error
        ? error.message
        : "Erro interno ao criar checkout.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 500,
      }
    );
  }
}