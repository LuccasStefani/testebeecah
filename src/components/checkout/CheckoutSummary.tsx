"use client";

import { checkoutContent } from "@/src/content/checkout";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getDeliveryText(quote: ShippingQuote) {
  const min = quote.deliveryRange?.min ?? quote.deliveryTime;

  const max = quote.deliveryRange?.max ?? quote.deliveryTime;

  if (typeof min === "number" && typeof max === "number") {
    if (min === max) {
      return `${min} ${min === 1 ? checkoutContent.diaUtil : checkoutContent.diasUteis}`;
    }

    return `${min} a ${max} dias úteis`;
  }

  if (typeof quote.deliveryTime === "number") {
    return `${quote.deliveryTime} ${
      quote.deliveryTime === 1 ? checkoutContent.diaUtil : checkoutContent.diasUteis
    }`;
  }

  return checkoutContent.prazoNaoInformado;
}

export default function CheckoutSummary() {
  const router = useRouter();

  const { items, totalPrice, updating } = useCart();
  const unavailable = items.some((item) => item.stock <= 0 || item.quantity < 1);

  const [userId, setUserId] = useState<string | null>(null);

  const [profileComplete, setProfileComplete] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const [changingAddress, setChangingAddress] = useState(false);

  const [loading, setLoading] = useState(true);

  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);

  const [selectedShippingId, setSelectedShippingId] = useState<number | null>(null);

  const [calculatingShipping, setCalculatingShipping] = useState(false);

  const [processingCheckout, setProcessingCheckout] = useState(false);

  const [shippingError, setShippingError] = useState<string | null>(null);

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  const cartKey =
    selectedAddressId +
    ":" +
    items
      .map((item) => `${item.id}:${item.quantity}`)
      .sort()
      .join("|");
  const [quotedCartKey, setQuotedCartKey] = useState<string | null>(null);

  const selectedShipping = useMemo(
    () =>
      quotedCartKey === cartKey
        ? (shippingQuotes.find((quote) => quote.serviceId === selectedShippingId) ?? null)
        : null,
    [shippingQuotes, selectedShippingId, quotedCartKey, cartKey],
  );

  const finalTotal = totalPrice + (selectedShipping?.price ?? 0);

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

      const [{ data: profile }, { data: addressData }] = await Promise.all([
        supabase
          .from("profiles")
          .select(checkoutContent.fullNamePhoneCpf)
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("addresses")
          .select(
            "\n            id,\n            label,\n            recipient_name,\n            phone,\n            zip_code,\n            street,\n            number,\n            complement,\n            neighborhood,\n            city,\n            state,\n            is_default\n          ",
          )
          .eq("user_id", user.id)
          .order("is_default", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          }),
      ]);

      const hasProfile =
        Boolean(profile?.full_name?.trim()) &&
        Boolean(profile?.phone?.trim()) &&
        Boolean(profile?.cpf?.trim());

      setProfileComplete(hasProfile);

      const loadedAddresses = addressData ?? [];

      setAddresses(loadedAddresses);

      const defaultAddress =
        loadedAddresses.find((address) => address.is_default) ??
        loadedAddresses[0] ??
        null;

      setSelectedAddressId(defaultAddress?.id ?? null);

      setLoading(false);
    }

    void loadCheckoutData().catch(() => {
      setShippingError(
        "Não foi possível carregar os dados de entrega. Recarregue a página para tentar novamente.",
      );
      setLoading(false);
    });
  }, []);

  function resetShipping() {
    setShippingQuotes([]);
    setSelectedShippingId(null);
    setShippingError(null);
  }

  function handleAddressChange(addressId: string) {
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
      const response = await fetch("/api/shipping/quote", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          addressId: selectedAddress.id,
        }),
      });

      const data = (await response.json()) as QuoteResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || checkoutContent.naoFoiPossivelCalcularOFrete);
      }

      const quotes = Array.isArray(data.quotes) ? data.quotes : [];

      if (quotes.length === 0) {
        throw new Error(checkoutContent.nenhumaModalidadeDeFreteEstaDisponivelParaEste);
      }

      setShippingQuotes(quotes);
      setQuotedCartKey(cartKey);

      /*
       * Não selecionamos automaticamente.
       * O cliente escolhe a modalidade.
       */
    } catch (error) {
      console.error(checkoutContent.erroAoCalcularFrete, error);

      setShippingError(
        error instanceof Error
          ? error.message
          : checkoutContent.naoFoiPossivelCalcularOFrete,
      );
    } finally {
      setCalculatingShipping(false);
    }
  }

  async function handleContinue() {
    if (
      updating ||
      calculatingShipping ||
      processingCheckout ||
      unavailable ||
      items.length === 0
    )
      return;
    if (!userId) {
      router.push("/login?next=/carrinho");
      return;
    }

    if (!profileComplete) {
      router.push("/minha-conta/dados");
      return;
    }

    if (!selectedAddress) {
      router.push("/minha-conta/enderecos/novo");
      return;
    }

    if (shippingQuotes.length === 0 || quotedCartKey !== cartKey) {
      await calculateShipping();
      return;
    }

    if (!selectedShipping) {
      setShippingError(checkoutContent.selecioneUmaModalidadeDeFreteParaContinuar);
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
      const response = await fetch("/api/checkout", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          addressId: selectedAddress.id,

          shippingServiceId: selectedShipping.serviceId,
        }),
      });

      const data = (await response.json()) as CheckoutResponse;

      if (!response.ok || !data.success) {
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

        throw new Error(data.message || checkoutContent.naoFoiPossivelPrepararOPagamento);
      }

      /*
       * No Checkout Pro via Preferences,
       * o init_point é a URL retornada
       * pelo Mercado Pago para iniciar
       * o checkout.
       */
      if (!data.initPoint) {
        throw new Error(checkoutContent.oMercadoPagoNaoRetornouAUrlDe);
      }

      /*
       * Não limpamos o carrinho aqui.
       *
       * O cliente ainda não pagou.
       * A confirmação definitiva será
       * tratada pelo webhook.
       */
      window.location.assign(data.initPoint);
    } catch (error) {
      console.error(checkoutContent.erroAoFinalizarCompra, error);

      setShippingError(
        error instanceof Error
          ? error.message
          : checkoutContent.naoFoiPossivelPrepararOPagamento,
      );

      setProcessingCheckout(false);
    }
  }

  if (loading) {
    return (
      <aside className="h-fit min-w-0">
        <p className="text-sm text-neutral-500">{checkoutContent.carregandoResumo}</p>
      </aside>
    );
  }

  return (
    <aside aria-label="Entrega e pagamento" className="h-fit min-w-0">
      <ol
        aria-label="Etapas da compra"
        className="mb-5 flex flex-wrap gap-x-3 gap-y-2 border-b border-neutral-200 pb-4 text-[11px] text-neutral-600"
      >
        <li className={!userId ? "font-medium text-beecah-blue" : ""}>1 · Conta</li>
        <li className={userId && !selectedShipping ? "font-medium text-beecah-blue" : ""}>
          2 · Entrega
        </li>
        <li className={selectedShipping ? "font-medium text-beecah-blue" : ""}>
          3 · Pagamento
        </li>
      </ol>
      <h3 className="text-sm font-medium">{checkoutContent.produtosNaSacola}</h3>

      <div className="mt-4 flex items-center justify-between border-b border-neutral-200 pb-5 text-sm">
        <span>
          {items.reduce((sum, item) => sum + item.quantity, 0)}
          {items.reduce((sum, item) => sum + item.quantity, 0) === 1
            ? " unidade"
            : checkoutContent.unidades}
        </span>

        <span className="font-medium">{formatPrice(totalPrice)}</span>
      </div>

      <div className="border-b border-neutral-200 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium">{checkoutContent.entrega}</p>

            {!userId ? (
              <p className="mt-2 text-sm text-neutral-500">
                {checkoutContent.entreNaSuaContaParaContinuar}
              </p>
            ) : !profileComplete ? (
              <p className="mt-2 text-sm text-neutral-500">
                {checkoutContent.completeSeusDadosPessoais}
              </p>
            ) : selectedAddress ? (
              <div className="mt-2 text-sm leading-6 text-neutral-600">
                <p className="font-medium text-neutral-950">
                  {selectedAddress.label || checkoutContent.endereco}
                </p>

                <p>
                  {selectedAddress.street}
                  {", "}
                  {selectedAddress.number}
                </p>

                <p>
                  {selectedAddress.city}
                  {" - "}
                  {selectedAddress.state}
                </p>

                <p>
                  {checkoutContent.cep}
                  {selectedAddress.zip_code}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">
                {checkoutContent.nenhumEnderecoCadastrado}
              </p>
            )}
          </div>

          {userId && profileComplete && addresses.length > 0 && (
            <button
              type="button"
              onClick={() => setChangingAddress((current) => !current)}
              disabled={processingCheckout || calculatingShipping || updating}
              className="text-sm font-medium underline underline-offset-4 disabled:opacity-50"
            >
              {checkoutContent.alterar}
            </button>
          )}
        </div>

        {changingAddress && (
          <div className="mt-5 space-y-3">
            {addresses.map((address) => (
              <label
                key={address.id}
                className="flex cursor-pointer gap-3 rounded-xl border border-neutral-200 p-4"
              >
                <input
                  type="radio"
                  name="checkout-address"
                  checked={selectedAddressId === address.id}
                  disabled={processingCheckout || calculatingShipping || updating}
                  onChange={() => handleAddressChange(address.id)}
                />

                <div className="text-sm">
                  <p className="font-medium">
                    {address.label || checkoutContent.endereco}

                    {address.is_default ? checkoutContent.principal2 : ""}
                  </p>

                  <p className="mt-1 text-neutral-500">
                    {address.street}
                    {", "}
                    {address.number}
                  </p>

                  <p className="text-neutral-500">
                    {address.city}
                    {" - "}
                    {address.state}
                  </p>
                </div>
              </label>
            ))}

            <Link
              href="/minha-conta/enderecos/novo"
              className="inline-block text-sm font-medium underline underline-offset-4"
            >
              {checkoutContent.adicionarOutroEndereco}
            </Link>

            <button
              type="button"
              onClick={() => setChangingAddress(false)}
              disabled={processingCheckout || calculatingShipping || updating}
              className="block w-full rounded-xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checkoutContent.confirmarEndereco}
            </button>
          </div>
        )}
      </div>

      <div className="border-b border-neutral-200 py-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">{checkoutContent.frete}</span>

          {selectedShipping && (
            <span className="text-sm font-medium">
              {formatPrice(selectedShipping.price)}
            </span>
          )}
        </div>

        {!userId || !profileComplete || !selectedAddress ? (
          <p className="mt-2 text-xs leading-5 text-neutral-500">
            {checkoutContent.informeSeusDadosEEnderecoParaCalcularO}
          </p>
        ) : shippingQuotes.length === 0 || quotedCartKey !== cartKey ? (
          <div className="mt-3">
            <p className="text-xs leading-5 text-neutral-500">
              {checkoutContent.calculeAsModalidadesDeEntregaDisponiveisParaEste}
            </p>

            <button
              type="button"
              onClick={calculateShipping}
              disabled={
                updating ||
                unavailable ||
                calculatingShipping ||
                processingCheckout ||
                items.length === 0
              }
              className="mt-3 w-full rounded-xl border border-neutral-950 px-4 py-3 text-sm font-medium transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {calculatingShipping
                ? checkoutContent.calculandoFrete
                : checkoutContent.calcularFrete}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {shippingQuotes.map((quote) => {
              const selected = selectedShippingId === quote.serviceId;

              return (
                <label
                  key={quote.serviceId}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    selected ? "border-neutral-950" : "border-neutral-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping-service"
                    checked={selected}
                    disabled={processingCheckout || calculatingShipping || updating}
                    onChange={() => {
                      setSelectedShippingId(quote.serviceId);

                      setShippingError(null);
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{quote.serviceName}</p>

                        <p className="mt-1 text-xs text-neutral-500">
                          {quote.companyName}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-medium">
                        {formatPrice(quote.price)}
                      </p>
                    </div>

                    <p className="mt-2 text-xs text-neutral-500">
                      {getDeliveryText(quote)}
                    </p>
                  </div>
                </label>
              );
            })}

            <button
              type="button"
              onClick={calculateShipping}
              disabled={calculatingShipping || processingCheckout}
              className="text-xs font-medium underline underline-offset-4 disabled:opacity-50"
            >
              {calculatingShipping
                ? checkoutContent.atualizando
                : checkoutContent.recalcularFrete}
            </button>
          </div>
        )}

        {shippingError && (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-red-50 p-3 text-sm leading-5 text-red-700"
          >
            {shippingError}
          </p>
        )}
      </div>

      <div className="space-y-3 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-neutral-600">{checkoutContent.produtos}</span>

          <span>{formatPrice(totalPrice)}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-neutral-600">{checkoutContent.frete}</span>

          <span>
            {selectedShipping
              ? formatPrice(selectedShipping.price)
              : checkoutContent.aCalcular}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-5">
          <span className="font-medium">
            {selectedShipping ? checkoutContent.total : checkoutContent.totalSemFrete}
          </span>

          <span className="text-3xl font-medium tracking-tight">
            {formatPrice(finalTotal)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={
          updating ||
          unavailable ||
          calculatingShipping ||
          processingCheckout ||
          items.length === 0
        }
        className="mt-6 min-h-14 w-full rounded-xl bg-beecah-black px-6 py-4 text-sm font-medium text-white transition hover:bg-beecah-blue disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processingCheckout
          ? checkoutContent.preparandoPagamento
          : !userId
            ? checkoutContent.entrarParaContinuar
            : !profileComplete
              ? checkoutContent.completarDados
              : !selectedAddress
                ? checkoutContent.adicionarEndereco
                : shippingQuotes.length === 0 || quotedCartKey !== cartKey
                  ? checkoutContent.calcularFrete
                  : !selectedShipping
                    ? checkoutContent.selecioneOFrete
                    : "Continuar para o Mercado Pago"}
      </button>
      <p role="status" className="mt-4 text-center text-xs leading-5 text-neutral-500">
        {unavailable
          ? "Remova os produtos indisponíveis para continuar."
          : updating
            ? "Atualizando sua sacola…"
            : "Confira a entrega antes de continuar. O pagamento acontece no Mercado Pago."}
      </p>
    </aside>
  );
}
