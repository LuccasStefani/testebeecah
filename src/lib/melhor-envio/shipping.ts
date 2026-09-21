import "server-only";

import {
  getMelhorEnvioAccessToken,
} from "@/src/lib/melhor-envio/client";

import { supabaseAdmin } from "@/src/lib/supabase/admin";

type MelhorEnvioCompany = {
  id?: number;
  name?: string;
  picture?: string;
};

type MelhorEnvioPackageProduct = {
  id?: string | number;
  quantity?: number;
};

type MelhorEnvioPackage = {
  price?: string;
  discount?: string;
  format?: string;

  weight?: string | number;

  insurance_value?:
    | string
    | number;

  dimensions?: {
    height?: number;
    width?: number;
    length?: number;
  };

  products?:
    MelhorEnvioPackageProduct[];
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

  packages?: MelhorEnvioPackage[];

  error?: string;
};

export type ShippingPackageProduct = {
  id: string;
  quantity: number;
};

export type ShippingPackage = {
  weight: number;

  width: number;
  height: number;
  length: number;

  insuranceValue: number | null;

  products:
    ShippingPackageProduct[];
};

export type ShippingQuote = {
  serviceId: number;
  serviceName: string;

  companyId: number | null;
  companyName: string;
  companyPicture: string | null;

  price: number;

  deliveryTime: number | null;

  deliveryRange: {
    min: number | null;
    max: number | null;
  };

  /*
   * Pacotes calculados pelo Melhor
   * Envio para este serviço.
   *
   * Estes dados serão congelados no
   * pedido e posteriormente usados
   * como volumes na criação do envio.
   */
  packages: ShippingPackage[];
};

export type ShippingQuoteResult = {
  addressId: string;

  destination: {
    city: string;
    state: string;
  };

  quotes: ShippingQuote[];
};

function onlyDigits(
  value: unknown
) {
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

function nonNegativeNumber(
  value: unknown
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return null;
  }

  return number;
}

function money(
  value: number
) {
  return Number(
    value.toFixed(2)
  );
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
        Accept:
          "application/json",

        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${accessToken}`,

        "User-Agent":
          userAgent,
      },

      body:
        JSON.stringify(payload),

      cache:
        "no-store",
    }
  );
}

/**
 * Calcula o frete usando exclusivamente
 * dados carregados pelo servidor.
 *
 * O navegador fornece apenas o addressId
 * para a rota que chama esta função.
 *
 * Aqui validamos novamente:
 * - endereço e proprietário;
 * - carrinho;
 * - produtos;
 * - estoque;
 * - preço;
 * - peso;
 * - dimensões;
 * - CEP de origem.
 *
 * Também preservamos os pacotes
 * calculados pelo Melhor Envio para
 * cada serviço disponível.
 */
export async function calculateShippingForUser(
  userId: string,
  addressId: string
): Promise<ShippingQuoteResult> {
  if (!userId) {
    throw new Error(
      "Usuário inválido para cálculo de frete."
    );
  }

  if (!addressId) {
    throw new Error(
      "Selecione um endereço de entrega."
    );
  }

  /*
   * 1. Carrega o endereço e confirma
   * que pertence ao usuário.
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
    .eq("user_id", userId)
    .maybeSingle();

  if (addressError) {
    console.error(
      "Erro ao carregar endereço para cotação:",
      addressError
    );

    throw new Error(
      "Não foi possível carregar o endereço de entrega."
    );
  }

  if (!address) {
    throw new Error(
      "Endereço de entrega não encontrado."
    );
  }

  const destinationPostalCode =
    onlyDigits(address.zip_code);

  if (
    destinationPostalCode.length !== 8
  ) {
    throw new Error(
      "O CEP do endereço de entrega é inválido."
    );
  }

  /*
   * 2. Carrega o carrinho diretamente
   * do banco.
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
    .eq("user_id", userId);

  if (cartError) {
    console.error(
      "Erro ao carregar carrinho para cotação:",
      cartError
    );

    throw new Error(
      "Não foi possível carregar o carrinho."
    );
  }

  if (
    !cartItems ||
    cartItems.length === 0
  ) {
    throw new Error(
      "Seu carrinho está vazio."
    );
  }

  /*
   * 3. Valida quantidades.
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
    throw new Error(
      "O carrinho possui uma quantidade inválida."
    );
  }

  const productIds =
    cartItems.map(
      (item) => item.product_id
    );

  /*
   * 4. Carrega os produtos do banco.
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

    throw new Error(
      "Não foi possível validar os produtos do carrinho."
    );
  }

  if (
    !products ||
    products.length !==
      productIds.length
  ) {
    throw new Error(
      "Um ou mais produtos do carrinho não estão disponíveis."
    );
  }

  /*
   * 5. Monta os produtos no formato
   * do Melhor Envio.
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
        id:
          product.id,

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
   * 6. CEP de origem fica somente
   * no servidor.
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
      receipt:
        false,

      own_hand:
        false,
    },
  };

  /*
   * 7. Obtém token válido.
   */
  let accessToken =
    await getMelhorEnvioAccessToken();

  /*
   * 8. Solicita a cotação.
   */
  let response =
    await requestQuote(
      accessToken,
      quotePayload
    );

  /*
   * Se houver problema de autorização,
   * renova o token e tenta uma única
   * vez novamente.
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

    throw new Error(
      "Não foi possível calcular o frete neste momento."
    );
  }

  if (
    !Array.isArray(responseData)
  ) {
    console.error(
      "Resposta inesperada do Melhor Envio:",
      responseData
    );

    throw new Error(
      "O Melhor Envio retornou uma resposta inválida."
    );
  }

  /*
   * 9. Normaliza os serviços válidos.
   *
   * Além de preço e prazo, preservamos
   * os packages retornados para cada
   * modalidade de frete.
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

        /*
         * Uma cotação válida para nosso
         * fluxo precisa possuir pelo
         * menos um pacote utilizável.
         */
        if (
          !Array.isArray(
            quote.packages
          ) ||
          quote.packages.length === 0
        ) {
          return null;
        }

        const packages =
          quote.packages.map(
            (
              currentPackage
            ): ShippingPackage | null => {
              const weight =
                positiveNumber(
                  currentPackage.weight
                );

              const width =
                positiveNumber(
                  currentPackage
                    .dimensions
                    ?.width
                );

              const height =
                positiveNumber(
                  currentPackage
                    .dimensions
                    ?.height
                );

              const length =
                positiveNumber(
                  currentPackage
                    .dimensions
                    ?.length
                );

              if (
                weight === null ||
                width === null ||
                height === null ||
                length === null
              ) {
                return null;
              }

              const insuranceValue =
                nonNegativeNumber(
                  currentPackage
                    .insurance_value
                );

              const packageProducts =
                Array.isArray(
                  currentPackage.products
                )
                  ? currentPackage.products
                      .map(
                        (
                          packageProduct
                        ): ShippingPackageProduct | null => {
                          const id =
                            String(
                              packageProduct
                                .id ??
                                ""
                            ).trim();

                          const quantity =
                            Number(
                              packageProduct
                                .quantity
                            );

                          if (
                            !id ||
                            !Number.isInteger(
                              quantity
                            ) ||
                            quantity <= 0
                          ) {
                            return null;
                          }

                          return {
                            id,
                            quantity,
                          };
                        }
                      )
                      .filter(
                        (
                          product
                        ): product is ShippingPackageProduct =>
                          product !==
                          null
                      )
                  : [];

              return {
                weight,
                width,
                height,
                length,

                insuranceValue,

                products:
                  packageProducts,
              };
            }
          );

        /*
         * Se qualquer pacote retornado
         * estiver inválido, descartamos
         * esta modalidade em vez de
         * salvar um snapshot incompleto.
         */
        if (
          packages.some(
            (currentPackage) =>
              currentPackage === null
          )
        ) {
          return null;
        }

        const normalizedPackages =
          packages as ShippingPackage[];

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

          packages:
            normalizedPackages,
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
    throw new Error(
      "Nenhuma modalidade de frete está disponível para este endereço."
    );
  }

  return {
    addressId:
      address.id,

    destination: {
      city:
        address.city,

      state:
        address.state,
    },

    quotes,
  };
}