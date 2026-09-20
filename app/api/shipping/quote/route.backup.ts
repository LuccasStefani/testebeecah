import { NextResponse } from "next/server";

import {
  getMelhorEnvioAccessToken,
} from "@/src/lib/melhor-envio/client";

import { supabaseAdmin } from "@/src/lib/supabase/admin";

import {
  createSupabaseServerClient,
} from "@/src/lib/supabase/server";

type QuoteRequestBody = {
  addressId?: unknown;
};

type MelhorEnvioCompany = {
  id?: number;
  name?: string;
  picture?: string;
};

type MelhorEnvioQuote = {
  id?: number;
  name?: string;

  price?: string;
  custom_price?: string;

  delivery_time?: number;
  custom_delivery_time?: number;

  delivery_range?: {
    min?: number;
    max?: number;
  };

  custom_delivery_range?: {
    min?: number;
    max?: number;
  };

  company?: MelhorEnvioCompany;

  error?: string;
};

function onlyDigits(value: unknown) {
  return String(value ?? "").replace(
    /\D/g,
    ""
  );
}

function positiveNumber(
  value: unknown
) {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return null;
  }

  return number;
}

function money(value: number) {
  return Number(value.toFixed(2));
}

async function requestQuote(
  accessToken: string,
  payload: unknown
) {
  const baseUrl =
    process.env.MELHOR_ENVIO_BASE_URL;

  const userAgent =
    process.env.MELHOR_ENVIO_USER_AGENT;

  if (!baseUrl || !userAgent) {
    throw new Error(
      "Configuração do Melhor Envio incompleta."
    );
  }

  return fetch(
    `${baseUrl}/api/v2/me/shipment/calculate`,
    {
      method: "POST",

      headers: {
        Accept: "application/json",

        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${accessToken}`,

        "User-Agent":
          userAgent,
      },

      body: JSON.stringify(payload),

      cache: "no-store",
    }
  );
}

export async function POST(
  request: Request
) {
  try {
    /*
     * 1. Identifica o usuário no servidor.
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
            "Você precisa estar logado para calcular o frete.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * 2. Recebe somente o ID do endereço.
     *
     * Não recebemos CEP, preço, peso,
     * dimensões ou produtos do navegador.
     */
    const body =
      (await request.json()) as
        QuoteRequestBody;

    const addressId =
      typeof body.addressId === "string"
        ? body.addressId.trim()
        : "";

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

    /*
     * 3. Carrega o endereço e confirma
     * que ele pertence ao usuário.
     */
    const {
      data: address,
      error: addressError,
    } = await supabaseAdmin
      .from("addresses")
      .select(`
        id,
        user_id,
        zip_code,
        city,
        state
      `)
      .eq("id", addressId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (addressError) {
      console.error(
        "Erro ao carregar endereço para cotação:",
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

    const destinationPostalCode =
      onlyDigits(address.zip_code);

    if (
      destinationPostalCode.length !== 8
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O CEP do endereço de entrega é inválido.",
        },
        {
          status: 400,
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
        "Erro ao carregar carrinho para cotação:",
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
     * 5. Valida as quantidades salvas
     * no carrinho.
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
     * 6. Carrega produtos diretamente
     * do banco, incluindo os dados
     * físicos usados no frete.
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
        active,
        weight,
        width,
        height,
        length
      `)
      .in("id", productIds)
      .eq("active", true);

    if (productsError) {
      console.error(
        "Erro ao carregar produtos para cotação:",
        productsError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível validar os produtos do carrinho.",
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
            "Um ou mais produtos do carrinho não estão disponíveis.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 7. Monta os produtos no formato
     * esperado pelo Melhor Envio.
     */
    const shippingProducts =
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

        const weight =
          positiveNumber(
            product.weight
          );

        const width =
          positiveNumber(
            product.width
          );

        const height =
          positiveNumber(
            product.height
          );

        const length =
          positiveNumber(
            product.length
          );

        if (
          weight === null ||
          width === null ||
          height === null ||
          length === null
        ) {
          throw new Error(
            `O produto "${product.name}" ainda não possui peso e dimensões válidos para calcular o frete.`
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
            `O produto "${product.name}" possui preço inválido.`
          );
        }

        return {
          id: product.id,

          width,
          height,
          length,
          weight,

          insurance_value:
            money(unitPrice),

          quantity,
        };
      });

    /*
     * 8. CEP de origem vem somente
     * da configuração do servidor.
     */
    const originPostalCode =
      onlyDigits(
        process.env
          .MELHOR_ENVIO_ORIGIN_POSTAL_CODE
      );

    if (
      originPostalCode.length !== 8
    ) {
      throw new Error(
        "CEP de origem do Melhor Envio não está configurado corretamente."
      );
    }

    const quotePayload = {
      from: {
        postal_code:
          originPostalCode,
      },

      to: {
        postal_code:
          destinationPostalCode,
      },

      products:
        shippingProducts,

      options: {
        receipt: false,
        own_hand: false,
      },
    };

    /*
     * 9. Obtém token válido.
     */
    let accessToken =
      await getMelhorEnvioAccessToken();

    /*
     * 10. Faz a cotação.
     */
    let response =
      await requestQuote(
        accessToken,
        quotePayload
      );

    /*
     * Se o token tiver sido invalidado
     * antes do expires_at salvo,
     * força uma renovação e tenta
     * exatamente mais uma vez.
     */
    if (
      response.status === 401 ||
      response.status === 403
    ) {
      accessToken =
        await getMelhorEnvioAccessToken(
          true
        );

      response =
        await requestQuote(
          accessToken,
          quotePayload
        );
    }

    const responseData =
      await response.json();

    if (!response.ok) {
      console.error(
        "Erro do Melhor Envio ao calcular frete:",
        responseData
      );

      return NextResponse.json(
        {
          success: false,

          message:
            "Não foi possível calcular o frete neste momento.",
        },
        {
          status: response.status,
        }
      );
    }

    if (
      !Array.isArray(responseData)
    ) {
      console.error(
        "Resposta inesperada do Melhor Envio:",
        responseData
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "O Melhor Envio retornou uma resposta inválida.",
        },
        {
          status: 502,
        }
      );
    }

    /*
     * 11. Normaliza somente serviços
     * realmente disponíveis.
     *
     * custom_price e
     * custom_delivery_time têm
     * prioridade sobre os valores
     * originais.
     */
    const quotes =
      (
        responseData as
          MelhorEnvioQuote[]
      )
        .filter(
          (quote) =>
            !quote.error &&
            quote.id !== undefined
        )
        .map((quote) => {
          const rawPrice =
            quote.custom_price ??
            quote.price;

          const price =
            Number(rawPrice);

          if (
            !Number.isFinite(price) ||
            price < 0
          ) {
            return null;
          }

          const deliveryTime =
            quote.custom_delivery_time ??
            quote.delivery_time ??
            null;

          const deliveryRange =
            quote.custom_delivery_range ??
            quote.delivery_range ??
            null;

          return {
            serviceId:
              Number(quote.id),

            serviceName:
              quote.name ??
              "Serviço de entrega",

            companyId:
              quote.company?.id ??
              null,

            companyName:
              quote.company?.name ??
              "Transportadora",

            companyPicture:
              quote.company?.picture ??
              null,

            price:
              money(price),

            deliveryTime,

            deliveryRange: {
              min:
                deliveryRange?.min ??
                deliveryTime,

              max:
                deliveryRange?.max ??
                deliveryTime,
            },
          };
        })
        .filter(
          (
            quote
          ): quote is NonNullable<
            typeof quote
          > => quote !== null
        )
        .sort(
          (a, b) =>
            a.price - b.price
        );

    if (quotes.length === 0) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Nenhuma modalidade de frete está disponível para este endereço.",
        },
        {
          status: 422,
        }
      );
    }

    return NextResponse.json({
      success: true,

      addressId:
        address.id,

      destination: {
        city: address.city,
        state: address.state,
      },

      quotes,
    });
  } catch (error) {
    console.error(
      "Erro ao calcular frete:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Erro interno ao calcular frete.";

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