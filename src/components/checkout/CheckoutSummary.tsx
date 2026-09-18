"use client";

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

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function CheckoutSummary() {
  const router = useRouter();

  const {
    items,
    totalPrice,
  } = useCart();

  const [userId, setUserId] =
    useState<string | null>(null);

  const [profileComplete, setProfileComplete] =
    useState(false);

  const [addresses, setAddresses] =
    useState<Address[]>([]);

  const [selectedAddressId, setSelectedAddressId] =
    useState<string | null>(null);

  const [changingAddress, setChangingAddress] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const selectedAddress = useMemo(
    () =>
      addresses.find(
        (address) =>
          address.id === selectedAddressId
      ) ?? null,
    [addresses, selectedAddressId]
  );

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

  function handleContinue() {
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

    router.push(
      `/checkout/frete?address=${selectedAddress.id}`
    );
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
                Entre na sua conta para continuar.
              </p>
            ) : !profileComplete ? (
              <p className="mt-2 text-sm text-neutral-500">
                Complete seus dados pessoais.
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
                Nenhum endereço cadastrado.
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
                className="text-sm font-medium underline underline-offset-4"
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
                    onChange={() =>
                      setSelectedAddressId(
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
              className="block w-full bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Confirmar endereço
            </button>
          </div>
        )}
      </div>

      <div className="border-b border-neutral-200 py-5">
        <div className="flex items-center justify-between">
          <span className="text-sm">
            Frete
          </span>

          <span className="text-sm text-neutral-500">
            A calcular
          </span>
        </div>

        <p className="mt-2 text-xs leading-5 text-neutral-500">
          O frete será calculado para o endereço
          selecionado antes do pagamento.
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="font-medium">
          Total parcial
        </span>

        <span className="text-2xl font-semibold">
          {formatPrice(totalPrice)}
        </span>
      </div>

      <button
        type="button"
        onClick={handleContinue}
        className="mt-6 w-full bg-neutral-950 px-6 py-4 text-sm font-medium text-white transition hover:bg-neutral-800"
      >
        {!userId
          ? "Entrar para continuar"
          : !profileComplete
            ? "Completar dados"
            : !selectedAddress
              ? "Adicionar endereço"
              : "Calcular frete"}
      </button>
    </aside>
  );
}