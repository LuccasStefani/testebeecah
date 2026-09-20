"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/src/contexts/CartContext";
import { supabase } from "@/src/lib/supabase/client";

type Address = {
  id: string;
  label: string | null;
  recipient_name: string;
  phone: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  is_default: boolean;
};

type ShippingQuote = {
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
};

type QuoteResponse = {
  success: boolean;
  message?: string;
  quotes?: ShippingQuote[];
};

type CheckoutResponse = {
  success: boolean;
  message?: string;
  orderId?: string;
  preferenceId?: string;
  initPoint?: string;
  sandboxInitPoint?: string;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(value);
}

function getDeliveryText(
  quote: ShippingQuote
) {
  const min =
    quote.deliveryRange?.min ??
    quote.deliveryTime;

  const max =
    quote.deliveryRange?.max ??
    quote.deliveryTime;

  if (
    typeof min === "number" &&
    typeof max === "number"
  ) {
    if (min === max) {
      return `${min} ${
        min === 1
          ? "dia útil"
          : "dias úteis"
      }`;
    }

    return `${min} a ${max} dias úteis`;
  }

  if (
    typeof quote.deliveryTime ===
    "number"
  ) {
    return `${quote.deliveryTime} ${
      quote.deliveryTime === 1
        ? "dia útil"
        : "dias úteis"
    }`;
  }

  return "Prazo não informado";
}

export default function CheckoutSummary() {
  const router = useRouter();

  const {
    items,
    totalPrice,
  } = useCart();

  const [userId, setUserId] =
    useState<string | null>(null);

  const [
    profileComplete,
    setProfileComplete,
  ] = useState(false);

  const [addresses, setAddresses] =
    useState<Address[]>([]);

  const [
    selectedAddressId,
    setSelectedAddressId,
  ] = useState<string | null>(null);

  const [
    changingAddress,
    setChangingAddress,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [
    shippingQuotes,
    setShippingQuotes,
  ] = useState<ShippingQuote[]>([]);

  const [
    selectedShippingId,
    setSelectedShippingId,
  ] = useState<number | null>(null);

  const [
    calculatingShipping,
    setCalculatingShipping,
  ] = useState(false);

  const [
    processingCheckout,
    setProcessingCheckout,
  ] = useState(false);

  const [
    shippingError,
    setShippingError,
  ] = useState<string | null>(null);

  const selectedAddress = useMemo(
    () =>
      addresses.find(
        (address) =>
          address.id ===
          selectedAddressId
      ) ?? null,
    [addresses, selectedAddressId]
  );

  const selectedShipping = useMemo(
    () =>
      shippingQuotes.find(
        (quote) =>
          quote.serviceId ===
          selectedShippingId
      ) ?? null,
    [
      shippingQuotes,
      selectedShippingId,
    ]
  );

  const finalTotal =
    totalPrice +
    (selectedShipping?.price ?? 0);

  useEffect(() => {
    async function loadCheckoutData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const [
        { data: profile },
        { data: addressData },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(`
            full_name,
            phone
          `)
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("addresses")
          .select(`
            id,
            label,
            recipient_name,
            phone,
            zip_code,
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
            is_default
          `)
          .eq("user_id", user.id)
          .order("is_default", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          }),
      ]);

      const hasProfile =
        Boolean(
          profile?.full_name?.trim()
        ) &&
        Boolean(
          profile?.phone?.trim()
        );

      setProfileComplete(hasProfile);

      const loadedAddresses =
        addressData ?? [];

      setAddresses(
        loadedAddresses
      );

      const defaultAddress =
        loadedAddresses.find(
          (address) =>
            address.is_default
        ) ??
        loadedAddresses[0] ??
        null;

      setSelectedAddressId(
        defaultAddress?.id ?? null
      );

      setLoading(false);
    }

    loadCheckoutData();
  }, []);

  function resetShipping() {
    setShippingQuotes([]);
    setSelectedShippingId(null);
    setShippingError(null);
  }

  function handleAddressChange(
    addressId: string
  ) {
    setSelectedAddressId(addressId);

    /*
     * Uma cotação pertence ao CEP
     * usado no cálculo.
     *
     * Ao trocar o endereço,
     * descartamos a cotação anterior.
     */
    resetShipping();
  }

  async function calculateShipping() {
    if (!selectedAddress) {
      return;
    }

    setCalculatingShipping(true);
    setShippingError(null);
    setShippingQuotes([]);
    setSelectedShippingId(null);

    try {
      const response = await fetch(
        "/api/shipping/quote",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            addressId:
              selectedAddress.id,
          }),
        }
      );

      const data =
        (await response.json()) as
          QuoteResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Não foi possível calcular o frete."
        );
      }

      const quotes =
        Array.isArray(data.quotes)
          ? data.quotes
          : [];

      if (quotes.length === 0) {
        throw new Error(
          "Nenhuma modalidade de frete está disponível para este endereço."
        );
      }

      setShippingQuotes(quotes);

      /*
       * Não selecionamos automaticamente.
       * O cliente escolhe a modalidade.
       */
    } catch (error) {
      console.error(
        "Erro ao calcular frete:",
        error
      );

      setShippingError(
        error instanceof Error
          ? error.message
          : "Não foi possível calcular o frete."
      );
    } finally {
      setCalculatingShipping(false);
    }
  }

  async function handleContinue() {
    if (!userId) {
      router.push("/login");
      return;
    }

    if (!profileComplete) {
      router.push(
        "/minha-conta/dados"
      );
      return;
    }

    if (!selectedAddress) {
      router.push(
        "/minha-conta/enderecos/novo"
      );
      return;
    }

    if (
      shippingQuotes.length === 0
    ) {
      await calculateShipping();
      return;
    }

    if (!selectedShipping) {
      setShippingError(
        "Selecione uma modalidade de frete para continuar."
      );
      return;
    }

    /*
     * Evita múltiplos cliques enquanto
     * o pedido está sendo preparado.
     */
    if (processingCheckout) {
      return;
    }

    setProcessingCheckout(true);
    setShippingError(null);

    try {
      /*
       * O navegador envia somente:
       *
       * - addressId
       * - shippingServiceId
       *
       * Produtos, quantidades, preços,
       * estoque e valor do frete serão
       * recalculados no servidor.
       */
      const response = await fetch(
        "/api/checkout",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            addressId:
              selectedAddress.id,

            shippingServiceId:
              selectedShipping.serviceId,
          }),
        }
      );

      const data =
        (await response.json()) as
          CheckoutResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        /*
         * 409 significa que o serviço
         * selecionado deixou de estar
         * disponível na nova cotação
         * feita pelo servidor.
         */
        if (response.status === 409) {
          setShippingQuotes([]);
          setSelectedShippingId(null);
        }

        throw new Error(
          data.message ||
            "Não foi possível preparar o pagamento."
        );
      }

      /*
       * No Checkout Pro via Preferences,
       * o init_point é a URL retornada
       * pelo Mercado Pago para iniciar
       * o checkout.
       */
      if (!data.initPoint) {
        throw new Error(
          "O Mercado Pago não retornou a URL de pagamento."
        );
      }

      /*
       * Não limpamos o carrinho aqui.
       *
       * O cliente ainda não pagou.
       * A confirmação definitiva será
       * tratada pelo webhook.
       */
      window.location.assign(
        data.initPoint
      );
    } catch (error) {
      console.error(
        "Erro ao finalizar compra:",
        error
      );

      setShippingError(
        error instanceof Error
          ? error.message
          : "Não foi possível preparar o pagamento."
      );

      setProcessingCheckout(false);
    }
  }

  if (loading) {
    return (
      <aside className="h-fit border border-neutral-200 p-6">
        <p className="text-sm text-neutral-500">
          Carregando resumo...
        </p>
      </aside>
    );
  }

  return (
    <aside className="h-fit border border-neutral-200 bg-white p-6">
      <h2 className="text-xl font-semibold">
        Resumo da compra
      </h2>

      <div className="mt-6 flex items-center justify-between border-b border-neutral-200 pb-5 text-sm">
        <span>
          {items.length}{" "}
          {items.length === 1
            ? "item"
            : "itens"}
        </span>

        <span className="font-medium">
          {formatPrice(totalPrice)}
        </span>
      </div>

      <div className="border-b border-neutral-200 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium">
              Entrega
            </p>

            {!userId ? (
              <p className="mt-2 text-sm text-neutral-500">
                Entre na sua conta para
                continuar.
              </p>
            ) : !profileComplete ? (
              <p className="mt-2 text-sm text-neutral-500">
                Complete seus dados
                pessoais.
              </p>
            ) : selectedAddress ? (
              <div className="mt-2 text-sm leading-6 text-neutral-600">
                <p className="font-medium text-neutral-950">
                  {selectedAddress.label ||
                    "Endereço"}
                </p>

                <p>
                  {selectedAddress.street},{" "}
                  {selectedAddress.number}
                </p>

                <p>
                  {selectedAddress.city} -{" "}
                  {selectedAddress.state}
                </p>

                <p>
                  CEP{" "}
                  {selectedAddress.zip_code}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">
                Nenhum endereço
                cadastrado.
              </p>
            )}
          </div>

          {userId &&
            profileComplete &&
            addresses.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setChangingAddress(
                    (current) =>
                      !current
                  )
                }
                disabled={
                  processingCheckout
                }
                className="text-sm font-medium underline underline-offset-4 disabled:opacity-50"
              >
                Alterar
              </button>
            )}
        </div>

        {changingAddress && (
          <div className="mt-5 space-y-3">
            {addresses.map(
              (address) => (
                <label
                  key={address.id}
                  className="flex cursor-pointer gap-3 border border-neutral-200 p-4"
                >
                  <input
                    type="radio"
                    name="checkout-address"
                    checked={
                      selectedAddressId ===
                      address.id
                    }
                    disabled={
                      processingCheckout
                    }
                    onChange={() =>
                      handleAddressChange(
                        address.id
                      )
                    }
                  />

                  <div className="text-sm">
                    <p className="font-medium">
                      {address.label ||
                        "Endereço"}

                      {address.is_default
                        ? " · Principal"
                        : ""}
                    </p>

                    <p className="mt-1 text-neutral-500">
                      {address.street},{" "}
                      {address.number}
                    </p>

                    <p className="text-neutral-500">
                      {address.city} -{" "}
                      {address.state}
                    </p>
                  </div>
                </label>
              )
            )}

            <Link
              href="/minha-conta/enderecos/novo"
              className="inline-block text-sm font-medium underline underline-offset-4"
            >
              + Adicionar outro endereço
            </Link>

            <button
              type="button"
              onClick={() =>
                setChangingAddress(false)
              }
              disabled={
                processingCheckout
              }
              className="block w-full bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirmar endereço
            </button>
          </div>
        )}
      </div>

      <div className="border-b border-neutral-200 py-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">
            Frete
          </span>

          {selectedShipping && (
            <span className="text-sm font-medium">
              {formatPrice(
                selectedShipping.price
              )}
            </span>
          )}
        </div>

        {!userId ||
        !profileComplete ||
        !selectedAddress ? (
          <p className="mt-2 text-xs leading-5 text-neutral-500">
            Informe seus dados e endereço
            para calcular o frete.
          </p>
        ) : shippingQuotes.length ===
          0 ? (
          <div className="mt-3">
            <p className="text-xs leading-5 text-neutral-500">
              Calcule as modalidades de
              entrega disponíveis para este
              endereço.
            </p>

            <button
              type="button"
              onClick={calculateShipping}
              disabled={
                calculatingShipping ||
                processingCheckout ||
                items.length === 0
              }
              className="mt-3 w-full border border-neutral-950 px-4 py-3 text-sm font-medium transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {calculatingShipping
                ? "Calculando frete..."
                : "Calcular frete"}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {shippingQuotes.map(
              (quote) => {
                const selected =
                  selectedShippingId ===
                  quote.serviceId;

                return (
                  <label
                    key={
                      quote.serviceId
                    }
                    className={`flex cursor-pointer items-start gap-3 border p-4 transition ${
                      selected
                        ? "border-neutral-950"
                        : "border-neutral-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping-service"
                      checked={selected}
                      disabled={
                        processingCheckout
                      }
                      onChange={() => {
                        setSelectedShippingId(
                          quote.serviceId
                        );

                        setShippingError(
                          null
                        );
                      }}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">
                            {
                              quote.serviceName
                            }
                          </p>

                          <p className="mt-1 text-xs text-neutral-500">
                            {
                              quote.companyName
                            }
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-medium">
                          {formatPrice(
                            quote.price
                          )}
                        </p>
                      </div>

                      <p className="mt-2 text-xs text-neutral-500">
                        {getDeliveryText(
                          quote
                        )}
                      </p>
                    </div>
                  </label>
                );
              }
            )}

            <button
              type="button"
              onClick={calculateShipping}
              disabled={
                calculatingShipping ||
                processingCheckout
              }
              className="text-xs font-medium underline underline-offset-4 disabled:opacity-50"
            >
              {calculatingShipping
                ? "Atualizando..."
                : "Recalcular frete"}
            </button>
          </div>
        )}

        {shippingError && (
          <p className="mt-3 text-sm leading-5 text-neutral-600">
            {shippingError}
          </p>
        )}
      </div>

      <div className="space-y-3 pt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">
            Produtos
          </span>

          <span>
            {formatPrice(totalPrice)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">
            Frete
          </span>

          <span>
            {selectedShipping
              ? formatPrice(
                  selectedShipping.price
                )
              : "—"}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
          <span className="font-medium">
            Total
          </span>

          <span className="text-2xl font-semibold">
            {formatPrice(finalTotal)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={
          calculatingShipping ||
          processingCheckout ||
          items.length === 0
        }
        className="mt-6 w-full bg-neutral-950 px-6 py-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processingCheckout
          ? "Preparando pagamento..."
          : !userId
            ? "Entrar para continuar"
            : !profileComplete
              ? "Completar dados"
              : !selectedAddress
                ? "Adicionar endereço"
                : shippingQuotes.length ===
                    0
                  ? "Calcular frete"
                  : !selectedShipping
                    ? "Selecione o frete"
                    : "Finalizar compra"}
      </button>
    </aside>
  );
}