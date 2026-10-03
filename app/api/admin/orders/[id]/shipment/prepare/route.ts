import { NextResponse } from "next/server";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import {
  createMelhorEnvioSandboxCartItem,
  type CreateMelhorEnvioCartItemPayload,
} from "@/src/lib/melhor-envio/shipment";
import { supabaseAdmin } from "@/src/lib/supabase/admin";
import { isValidCpf } from "@/src/lib/validation/cpf";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

type ReservationResult = {
  shipment_id: string;
  reservation_created: boolean;
};

function onlyDigits(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

function positiveNumber(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  return number;
}

function money(value: number) {
  return Number(value.toFixed(2));
}

function validEmail(value: unknown) {
  const email = String(value ?? "").trim();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPhone(value: unknown) {
  const phone = onlyDigits(value);

  return phone.length === 10 || phone.length === 11;
}

function validPostalCode(value: unknown) {
  return onlyDigits(value).length === 8;
}

function validState(value: unknown) {
  return /^[A-Z]{2}$/.test(
    String(value ?? "").trim().toUpperCase(),
  );
}

export async function POST(
  _request: Request,
  { params }: RouteProps,
) {
  try {
    /*
     * 1. Somente administradores podem
     * preparar envios.
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
     * 2. Carrega exclusivamente os dados
     * congelados no pedido.
     */
    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select(
          `
          id,
          status,
          subtotal,
          shipping_service_id,
          shipping_service_name,
          shipping_company_id,
          shipping_company_name
        `,
        )
        .eq("id", orderId)
        .maybeSingle();

    if (orderError) {
      console.error(
        "Erro ao buscar pedido para envio:",
        orderError,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível consultar o pedido.",
        },
        {
          status: 500,
        },
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Pedido não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * 3. Somente pedidos aprovados podem
     * entrar no fluxo de expedição.
     */
    if (order.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Somente pedidos com pagamento aprovado podem ser preparados para envio.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 4. Valida modalidade de frete.
     */
    const serviceId = Number(
      order.shipping_service_id,
    );

    const companyId = Number(
      order.shipping_company_id,
    );

    if (
      !Number.isInteger(serviceId) ||
      serviceId <= 0 ||
      !Number.isInteger(companyId) ||
      companyId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O pedido não possui uma modalidade de frete válida.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 5. Carrega o endereço congelado
     * do destinatário.
     */
    const {
      data: shippingAddress,
      error: shippingAddressError,
    } = await supabaseAdmin
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
      console.error(
        "Erro ao buscar endereço do pedido:",
        shippingAddressError,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível consultar o endereço de entrega.",
        },
        {
          status: 500,
        },
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O pedido não possui endereço de entrega congelado.",
        },
        {
          status: 409,
        },
      );
    }

    const recipientName = String(
      shippingAddress.recipient_name ?? "",
    ).trim();

    const recipientDocument = onlyDigits(
      shippingAddress.recipient_document,
    );

    const recipientEmail = String(
      shippingAddress.recipient_email ?? "",
    ).trim();

    const recipientPhone = onlyDigits(
      shippingAddress.phone,
    );

    const recipientPostalCode = onlyDigits(
      shippingAddress.zip_code,
    );

    const recipientStreet = String(
      shippingAddress.street ?? "",
    ).trim();

    const recipientNumber = String(
      shippingAddress.number ?? "",
    ).trim();

    const recipientComplement = String(
      shippingAddress.complement ?? "",
    ).trim();

    const recipientDistrict = String(
      shippingAddress.neighborhood ?? "",
    ).trim();

    const recipientCity = String(
      shippingAddress.city ?? "",
    ).trim();

    const recipientState = String(
      shippingAddress.state ?? "",
    )
      .trim()
      .toUpperCase();

    const recipientComplete =
      Boolean(recipientName) &&
      isValidCpf(recipientDocument) &&
      validEmail(recipientEmail) &&
      validPhone(recipientPhone) &&
      validPostalCode(recipientPostalCode) &&
      Boolean(recipientStreet) &&
      Boolean(recipientNumber) &&
      Boolean(recipientDistrict) &&
      Boolean(recipientCity) &&
      validState(recipientState);

    if (!recipientComplete) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Os dados congelados do destinatário estão incompletos ou inválidos.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 6. Carrega os pacotes congelados
     * durante o checkout.
     */
    const {
      data: packages,
      error: packagesError,
    } = await supabaseAdmin
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
      console.error(
        "Erro ao buscar pacotes do pedido:",
        packagesError,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível consultar os pacotes do pedido.",
        },
        {
          status: 500,
        },
      );
    }

    if (!packages || packages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O pedido não possui pacotes de envio congelados.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Alguns serviços não aceitam múltiplos
     * volumes em uma única criação de envio.
     *
     * Quando habilitarmos esse cenário,
     * criaremos um shipment separado por volume.
     */
    const normalizedCompanyName = String(
      order.shipping_company_name ?? "",
    ).toLowerCase();

    const requiresSeparateShipments =
      packages.length > 1 &&
      (
        serviceId === 27 ||
        normalizedCompanyName.includes(
          "correios",
        ) ||
        normalizedCompanyName.includes(
          "j&t",
        ) ||
        normalizedCompanyName.includes(
          "loggi",
        )
      );

    if (requiresSeparateShipments) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Esta modalidade exige um envio separado para cada volume. O fluxo de múltiplas etiquetas ainda não está habilitado.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 7. Valida as dimensões congeladas
     * dos volumes.
     */
    const volumes = packages.map(
      (shippingPackage) => {
        const weight = positiveNumber(
          shippingPackage.weight,
        );

        const width = positiveNumber(
          shippingPackage.width,
        );

        const height = positiveNumber(
          shippingPackage.height,
        );

        const length = positiveNumber(
          shippingPackage.length,
        );

        if (
          weight === null ||
          width === null ||
          height === null ||
          length === null
        ) {
          throw new Error(
            "Um dos volumes congelados possui peso ou dimensões inválidos.",
          );
        }

        return {
          height,
          width,
          length,
          weight,
        };
      },
    );

    /*
     * 8. IDs dos pacotes que formarão
     * esta reserva.
     *
     * A proteção definitiva contra
     * duplicidade acontecerá dentro da
     * transação reserve_order_shipment().
     */
    const packageIds = packages.map(
      (shippingPackage) =>
        shippingPackage.id,
    );

    /*
     * 9. Carrega o remetente ativo.
     *
     * Estes dados nunca são enviados
     * de volta ao navegador.
     */
    const {
      data: sender,
      error: senderError,
    } = await supabaseAdmin
      .from("shipping_senders")
      .select(
        `
        id,
        name,
        email,
        phone,
        person_type,
        document_number,
        state_register,
        economic_activity_code,
        address,
        number,
        complement,
        district,
        city,
        state,
        postal_code,
        country_id
      `,
      )
      .eq("active", true)
      .maybeSingle();

    if (senderError) {
      console.error(
        "Erro ao buscar remetente ativo:",
        senderError,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível consultar o remetente.",
        },
        {
          status: 500,
        },
      );
    }

    if (!sender) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Nenhum remetente ativo está configurado.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Por enquanto o fluxo de homologação
     * está preparado para Pessoa Física.
     *
     * Quando a Beecah migrar para CNPJ,
     * revisaremos também o fluxo fiscal
     * antes da entrada em produção.
     */
    if (sender.person_type !== "individual") {
      return NextResponse.json(
        {
          success: false,
          message:
            "O fluxo atual de homologação está configurado para remetente Pessoa Física.",
        },
        {
          status: 409,
        },
      );
    }

    const senderName = String(
      sender.name ?? "",
    ).trim();

    const senderEmail = String(
      sender.email ?? "",
    ).trim();

    const senderPhone = onlyDigits(
      sender.phone,
    );

    const senderDocument = onlyDigits(
      sender.document_number,
    );

    const senderAddress = String(
      sender.address ?? "",
    ).trim();

    const senderNumber = String(
      sender.number ?? "",
    ).trim();

    const senderComplement = String(
      sender.complement ?? "",
    ).trim();

    const senderDistrict = String(
      sender.district ?? "",
    ).trim();

    const senderCity = String(
      sender.city ?? "",
    ).trim();

    const senderState = String(
      sender.state ?? "",
    )
      .trim()
      .toUpperCase();

    const senderPostalCode = onlyDigits(
      sender.postal_code,
    );

    const senderCountry = String(
      sender.country_id ?? "",
    )
      .trim()
      .toUpperCase();

    const senderComplete =
      Boolean(senderName) &&
      validEmail(senderEmail) &&
      validPhone(senderPhone) &&
      isValidCpf(senderDocument) &&
      Boolean(senderAddress) &&
      Boolean(senderNumber) &&
      Boolean(senderDistrict) &&
      Boolean(senderCity) &&
      validState(senderState) &&
      validPostalCode(senderPostalCode) &&
      senderCountry === "BR";

    if (!senderComplete) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Os dados do remetente estão incompletos ou inválidos.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 10. Carrega os produtos congelados
     * no momento do checkout.
     */
    const {
      data: orderItems,
      error: orderItemsError,
    } = await supabaseAdmin
      .from("order_items")
      .select(
        `
        id,
        product_name,
        unit_price,
        quantity,
        subtotal
      `,
      )
      .eq("order_id", orderId)
      .order("created_at", {
        ascending: true,
      });

    if (orderItemsError) {
      console.error(
        "Erro ao buscar itens congelados do pedido:",
        orderItemsError,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível consultar os produtos do pedido.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      !orderItems ||
      orderItems.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O pedido não possui produtos congelados para o envio.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 11. Monta products no formato
     * esperado pelo Melhor Envio.
     */
    const products = orderItems.map(
      (item) => {
        const name = String(
          item.product_name ?? "",
        ).trim();

        const quantity = Number(
          item.quantity,
        );

        const unitaryValue =
          positiveNumber(
            item.unit_price,
          );

        const storedSubtotal =
          positiveNumber(
            item.subtotal,
          );

        if (
          !name ||
          !Number.isInteger(quantity) ||
          quantity <= 0 ||
          unitaryValue === null ||
          storedSubtotal === null
        ) {
          throw new Error(
            "Um dos produtos congelados possui dados inválidos.",
          );
        }

        const expectedSubtotal = money(
          unitaryValue * quantity,
        );

        if (
          Math.abs(
            expectedSubtotal -
              storedSubtotal,
          ) > 0.01
        ) {
          throw new Error(
            "O subtotal de um dos produtos não corresponde ao snapshot do pedido.",
          );
        }

        return {
          name,
          quantity,
          unitary_value:
            money(unitaryValue),
        };
      },
    );

    /*
     * 12. Confere o subtotal financeiro
     * congelado no pedido.
     */
    const orderSubtotal =
      positiveNumber(order.subtotal);

    if (orderSubtotal === null) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O subtotal congelado do pedido é inválido.",
        },
        {
          status: 409,
        },
      );
    }

    const productsSubtotal = money(
      products.reduce(
        (sum, product) =>
          sum +
          product.unitary_value *
            product.quantity,
        0,
      ),
    );

    if (
      Math.abs(
        productsSubtotal -
          orderSubtotal,
      ) > 0.01
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Os valores dos produtos não correspondem ao subtotal congelado do pedido.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 13. Monta o payload REAL.
     *
     * Nesta etapa ele ainda NÃO é
     * enviado ao Melhor Envio.
     *
     * Também não retornamos o payload
     * ao navegador porque contém CPF,
     * telefone, e-mail e endereço.
     */
    const payload:
      CreateMelhorEnvioCartItemPayload = {
      service: serviceId,

      from: {
        name: senderName,
        email: senderEmail,
        phone: senderPhone,
        document: senderDocument,

        address: senderAddress,
        complement:
          senderComplement,
        number: senderNumber,
        district: senderDistrict,
        city: senderCity,
        postal_code:
          senderPostalCode,
        state_abbr: senderState,

        country_id: "BR",
      },

      to: {
        name: recipientName,
        email: recipientEmail,
        phone: recipientPhone,
        document:
          recipientDocument,

        address: recipientStreet,
        complement:
          recipientComplement,
        number: recipientNumber,
        district:
          recipientDistrict,
        city: recipientCity,
        postal_code:
          recipientPostalCode,
        state_abbr:
          recipientState,

        country_id: "BR",
      },

      products,

      volumes,

      options: {
        platform: "Beecah",

        reminder:
          `Pedido ${order.id}`,

        insurance_value:
          productsSubtotal,

        receipt: false,
        own_hand: false,
        reverse: false,

        tags: [
          {
            tag: order.id,
            url: null,
          },
        ],
      },
    };

    /*
     * 14. Cria uma reservation_key
     * determinística.
     *
     * O mesmo pedido + mesmo conjunto
     * de pacotes sempre produz a mesma
     * chave.
     */
    const sortedPackageIds = [
      ...packageIds,
    ].sort();

    const reservationKey =
      `order:${order.id}:packages:${sortedPackageIds.join(",")}`;

    /*
     * 15. Reserva o shipment localmente.
     *
     * reserve_order_shipment() executa
     * em uma única transação PostgreSQL:
     *
     * - confirma que o pedido continua
     *   aprovado;
     * - confirma que os pacotes pertencem
     *   ao pedido;
     * - cria order_shipments;
     * - associa os pacotes;
     * - impede reservas duplicadas.
     *
     * IMPORTANTE:
     * ainda NÃO chamamos o Melhor Envio.
     */
    const {
      data: reservationData,
      error: reservationError,
    } = await supabaseAdmin.rpc(
      "reserve_order_shipment",
      {
        p_order_id: order.id,
        p_provider:
          "melhor_envio",
        p_reservation_key:
          reservationKey,
        p_service_id: serviceId,
        p_service_name:
          String(
            order.shipping_service_name ??
              "",
          ).trim() || null,
        p_company_id: companyId,
        p_company_name:
          String(
            order.shipping_company_name ??
              "",
          ).trim() || null,
        p_package_ids:
          sortedPackageIds,
      },
    );

    /*
     * Se outro shipment já possuir um
     * dos pacotes, a constraint UNIQUE
     * de order_shipment_packages impede
     * a duplicação.
     */
    if (reservationError) {
      if (
        reservationError.code ===
        "23505"
      ) {
        return NextResponse.json(
          {
            success: false,
            readyToPrepare: false,
            payloadReady: true,
            reservationCreated:
              false,
            providerCallExecuted:
              false,
            message:
              "Um ou mais pacotes deste pedido já possuem um envio reservado.",
          },
          {
            status: 409,
          },
        );
      }

      console.error(
        "Erro ao reservar shipment:",
        reservationError.message,
      );

      return NextResponse.json(
        {
          success: false,
          readyToPrepare: false,
          payloadReady: true,
          reservationCreated:
            false,
          providerCallExecuted:
            false,
          message:
            "Não foi possível reservar o envio no banco de dados.",
        },
        {
          status: 500,
        },
      );
    }

    const reservationRows =
      reservationData as
        | ReservationResult[]
        | null;

    const reservation =
      reservationRows?.[0];

    if (
      !reservation?.shipment_id
    ) {
      console.error(
        "A reserva do shipment não retornou um identificador.",
      );

      return NextResponse.json(
        {
          success: false,
          readyToPrepare: false,
          payloadReady: true,
          reservationCreated:
            false,
          providerCallExecuted:
            false,
          message:
            "A reserva do envio não retornou um identificador válido.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * Se duas requisições chegarem
     * praticamente ao mesmo tempo,
     * somente uma delas consegue criar
     * a reserva.
     *
     * A outra encontra a reserva
     * existente e para aqui.
     */
    if (
      !reservation.reservation_created
    ) {
      return NextResponse.json(
        {
          success: false,

          readyToPrepare: false,

          payloadReady: true,

          reservationCreated:
            false,

          providerCallExecuted:
            false,

          shipmentId:
            reservation.shipment_id,

          message:
            "Este envio já possui uma reserva em andamento.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 16. Reserva criada.
     *
     * Neste ponto:
     *
     * order_shipments
     *   status = pending
     *
     * order_shipment_packages
     *   pacotes vinculados
     *
     * Melhor Envio:
     *   NÃO chamado.
     *
     * Nenhum dado pessoal é retornado.
     */
        /*
     * 16. Reserva criada.
     *
     * Somente a requisição que realmente criou
     * a reserva local pode chamar o Melhor Envio.
     *
     * Se a chamada externa falhar ou ficar ambígua,
     * mantemos a reserva pending. Não fazemos retry
     * automático para evitar criar duas etiquetas.
     */
    let providerShipmentId: string;

    try {
      const providerResult =
        await createMelhorEnvioSandboxCartItem(
          payload,
        );

      providerShipmentId =
        providerResult.providerShipmentId;
    } catch (providerError) {
      console.error(
        "Erro ao criar envio no carrinho do Melhor Envio:",
        providerError instanceof Error
          ? providerError.message
          : "Erro desconhecido",
      );

      return NextResponse.json(
        {
          success: false,

          readyToPrepare: false,

          payloadReady: true,

          reservationCreated: true,

          providerCallExecuted: true,

          shipmentId:
            reservation.shipment_id,

          providerShipmentId: null,

          needsReconciliation: true,

          message:
            "A reserva local foi criada, mas o Melhor Envio não confirmou a inclusão no carrinho. A reserva foi mantida para evitar duplicidade.",
        },
        {
          status: 502,
        },
      );
    }

    /*
     * 17. O Melhor Envio confirmou a criação
     * do item no carrinho e retornou o ID.
     *
     * Agora persistimos esse identificador
     * antes de continuar qualquer outra etapa.
     */
    const {
      data: finalizedShipment,
      error: finalizeError,
    } = await supabaseAdmin
      .from("order_shipments")
      .update({
        provider_shipment_id:
          providerShipmentId,

        status: "cart",

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        reservation.shipment_id,
      )
      .eq(
        "provider",
        "melhor_envio",
      )
      .eq(
        "status",
        "pending",
      )
      .is(
        "provider_shipment_id",
        null,
      )
      .select(
        "id, provider_shipment_id, status",
      )
      .maybeSingle();

    /*
     * Se o Melhor Envio criou o item, mas não
     * conseguimos persistir o ID localmente,
     * NÃO chamamos o provedor novamente.
     *
     * O ID remoto é retornado ao admin para
     * permitir reconciliação controlada.
     */
    if (
      finalizeError ||
      !finalizedShipment
    ) {
      console.error(
        "Envio criado no Melhor Envio, mas não finalizado no banco:",
        {
          shipmentId:
            reservation.shipment_id,

          providerShipmentId,

          databaseMessage:
            finalizeError?.message ??
            null,
        },
      );

      return NextResponse.json(
        {
          success: false,

          readyToPrepare: false,

          payloadReady: true,

          reservationCreated: true,

          providerCallExecuted: true,

          shipmentId:
            reservation.shipment_id,

          providerShipmentId,

          needsReconciliation: true,

          message:
            "O Melhor Envio criou o envio, mas o identificador não pôde ser confirmado no banco. Não tente criar outra etiqueta automaticamente.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * 18. Estado esperado:
     *
     * order_shipments.status = cart
     * provider_shipment_id = ID do Melhor Envio
     *
     * A partir daqui o próximo passo será
     * comprar o frete no Sandbox.
     */
    return NextResponse.json({
      success: true,

      readyToPrepare: false,

      payloadReady: true,

      reservationCreated: true,

      providerCallExecuted: true,

      needsReconciliation: false,

      shipmentId:
        reservation.shipment_id,

      providerShipmentId,

      message:
        "Envio inserido no carrinho do Melhor Envio Sandbox com sucesso.",

      orderId: order.id,

      preview: {
        serviceId:
          payload.service,

        serviceName:
          order.shipping_service_name,

        companyId,

        companyName:
          order.shipping_company_name,

        productsCount:
          payload.products.length,

        totalQuantity:
          payload.products.reduce(
            (
              sum,
              product,
            ) =>
              sum +
              product.quantity,
            0,
          ),

        volumesCount:
          payload.volumes.length,

        insuranceValue:
          payload.options
            .insurance_value,

        sender: {
          personType:
            sender.person_type,

          documentValid: true,
          emailValid: true,
          phoneValid: true,
          postalCodeValid: true,
          stateValid: true,
        },

        recipient: {
          documentValid: true,
          emailValid: true,
          phoneValid: true,
          postalCodeValid: true,
          stateValid: true,
        },
      },
    });
  } catch (error) {
    console.error(
      "Erro ao preparar envio do pedido:",
      error instanceof Error
        ? error.message
        : "Erro desconhecido",
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao preparar o envio.",
      },
      {
        status: 500,
      },
    );
  }
}