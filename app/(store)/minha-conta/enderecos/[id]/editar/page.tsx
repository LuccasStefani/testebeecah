"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import { supabase } from "@/src/lib/supabase/client";

export default function EditAddressPage() {
  const router = useRouter();

  const params =
    useParams<{
      id: string;
    }>();

  const addressId = params.id;

  const [recipientName, setRecipientName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [zipCode, setZipCode] =
    useState("");

  const [street, setStreet] =
    useState("");

  const [number, setNumber] =
    useState("");

  const [complement, setComplement] =
    useState("");

  const [
    neighborhood,
    setNeighborhood,
  ] = useState("");

  const [city, setCity] =
    useState("");

  const [state, setState] =
    useState("");

  const [label, setLabel] =
    useState("");

  const [isDefault, setIsDefault] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    async function loadAddress() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const {
        data: address,
        error,
      } = await supabase
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
        .eq("id", addressId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error(
          "Erro ao carregar endereço:",
          error
        );

        setErrorMessage(
          "Não foi possível carregar o endereço."
        );

        setLoading(false);
        return;
      }

      if (!address) {
        router.push("/minha-conta");
        return;
      }

      setRecipientName(
        address.recipient_name
      );

      setPhone(
        address.phone
      );

      setZipCode(
        address.zip_code
      );

      setStreet(
        address.street
      );

      setNumber(
        address.number
      );

      setComplement(
        address.complement ?? ""
      );

      setNeighborhood(
        address.neighborhood
      );

      setCity(
        address.city
      );

      setState(
        address.state
      );

      setLabel(
        address.label ?? ""
      );

      setIsDefault(
        address.is_default
      );

      setLoading(false);
    }

    loadAddress();
  }, [addressId, router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const normalizedRecipient =
      recipientName.trim();

    const normalizedPhone =
      phone.trim();

    const normalizedZip =
      zipCode.replace(/\D/g, "");

    const normalizedStreet =
      street.trim();

    const normalizedNumber =
      number.trim();

    const normalizedNeighborhood =
      neighborhood.trim();

    const normalizedCity =
      city.trim();

    const normalizedState =
      state.trim().toUpperCase();

    if (!normalizedRecipient) {
      setErrorMessage(
        "Informe o nome do destinatário."
      );

      return;
    }

    if (!normalizedPhone) {
      setErrorMessage(
        "Informe o telefone."
      );

      return;
    }

    if (
      normalizedZip.length !== 8
    ) {
      setErrorMessage(
        "Informe um CEP válido com 8 números."
      );

      return;
    }

    if (!normalizedStreet) {
      setErrorMessage(
        "Informe a rua."
      );

      return;
    }

    if (!normalizedNumber) {
      setErrorMessage(
        "Informe o número."
      );

      return;
    }

    if (!normalizedNeighborhood) {
      setErrorMessage(
        "Informe o bairro."
      );

      return;
    }

    if (!normalizedCity) {
      setErrorMessage(
        "Informe a cidade."
      );

      return;
    }

    if (
      normalizedState.length !== 2
    ) {
      setErrorMessage(
        "Informe a UF com 2 letras."
      );

      return;
    }

    try {
      setSaving(true);

      /*
       * Se este endereço vai ser o principal,
       * removemos o status principal de qualquer
       * outro endereço do usuário primeiro.
       */
      if (isDefault) {
        const {
          error: resetDefaultError,
        } = await supabase
          .from("addresses")
          .update({
            is_default: false,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "is_default",
            true
          )
          .neq(
            "id",
            addressId
          );

        if (resetDefaultError) {
          console.error(
            "Erro ao atualizar endereço principal:",
            resetDefaultError
          );

          setErrorMessage(
            "Não foi possível alterar o endereço principal."
          );

          return;
        }
      }

      const {
        error: updateError,
      } = await supabase
        .from("addresses")
        .update({
          label:
            label.trim() || null,

          recipient_name:
            normalizedRecipient,

          phone:
            normalizedPhone,

          zip_code:
            normalizedZip,

          street:
            normalizedStreet,

          number:
            normalizedNumber,

          complement:
            complement.trim() || null,

          neighborhood:
            normalizedNeighborhood,

          city:
            normalizedCity,

          state:
            normalizedState,

          is_default:
            isDefault,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          addressId
        )
        .eq(
          "user_id",
          user.id
        );

      if (updateError) {
        console.error(
          "Erro ao atualizar endereço:",
          updateError
        );

        setErrorMessage(
          "Não foi possível salvar o endereço."
        );

        return;
      }

      router.push(
        "/minha-conta"
      );

      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-neutral-500">
          Carregando...
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/minha-conta"
        className="text-sm text-neutral-500 transition hover:text-neutral-950"
      >
        ← Minha conta
      </Link>

      <div className="mt-6">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Entrega
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Editar endereço
        </h1>

        <p className="mt-2 text-neutral-500">
          Atualize os dados do endereço de entrega.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-10 space-y-6 border border-neutral-200 p-6"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="recipientName"
              className="mb-2 block text-sm font-medium"
            >
              Nome do destinatário
            </label>

            <input
              id="recipientName"
              type="text"
              required
              value={recipientName}
              onChange={(event) =>
                setRecipientName(
                  event.target.value
                )
              }
              className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium"
            >
              Telefone
            </label>

            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(event) =>
                setPhone(
                  event.target.value
                )
              }
              placeholder="(11) 99999-9999"
              className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
          <div>
            <label
              htmlFor="zipCode"
              className="mb-2 block text-sm font-medium"
            >
              CEP
            </label>

            <input
              id="zipCode"
              type="text"
              required
              inputMode="numeric"
              value={zipCode}
              onChange={(event) =>
                setZipCode(
                  event.target.value
                )
              }
              placeholder="00000-000"
              className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>

          <div>
            <label
              htmlFor="street"
              className="mb-2 block text-sm font-medium"
            >
              Rua / Avenida
            </label>

            <input
              id="street"
              type="text"
              required
              value={street}
              onChange={(event) =>
                setStreet(
                  event.target.value
                )
              }
              className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
          <div>
            <label
              htmlFor="number"
              className="mb-2 block text-sm font-medium"
            >
              Número
            </label>

            <input
              id="number"
              type="text"
              required
              value={number}
              onChange={(event) =>
                setNumber(
                  event.target.value
                )
              }
              className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>

          <div>
            <label
              htmlFor="complement"
              className="mb-2 block text-sm font-medium"
            >
              Complemento
            </label>

            <input
              id="complement"
              type="text"
              value={complement}
              onChange={(event) =>
                setComplement(
                  event.target.value
                )
              }
              placeholder="Apartamento, bloco..."
              className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="neighborhood"
            className="mb-2 block text-sm font-medium"
          >
            Bairro
          </label>

          <input
            id="neighborhood"
            type="text"
            required
            value={neighborhood}
            onChange={(event) =>
              setNeighborhood(
                event.target.value
              )
            }
            className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_120px]">
          <div>
            <label
              htmlFor="city"
              className="mb-2 block text-sm font-medium"
            >
              Cidade
            </label>

            <input
              id="city"
              type="text"
              required
              value={city}
              onChange={(event) =>
                setCity(
                  event.target.value
                )
              }
              className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            />
          </div>

          <div>
            <label
              htmlFor="state"
              className="mb-2 block text-sm font-medium"
            >
              UF
            </label>

            <input
              id="state"
              type="text"
              required
              maxLength={2}
              value={state}
              onChange={(event) =>
                setState(
                  event.target.value
                )
              }
              placeholder="SP"
              className="w-full border border-neutral-300 px-4 py-3 uppercase outline-none transition focus:border-neutral-950"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="label"
            className="mb-2 block text-sm font-medium"
          >
            Nome do endereço
          </label>

          <input
            id="label"
            type="text"
            value={label}
            onChange={(event) =>
              setLabel(
                event.target.value
              )
            }
            placeholder="Casa, Trabalho..."
            className="w-full border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
          />
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(event) =>
              setIsDefault(
                event.target.checked
              )
            }
          />

          Usar como endereço principal
        </label>

        {errorMessage && (
          <p className="text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Salvando..."
              : "Salvar alterações"}
          </button>

          <Link
            href="/minha-conta"
            className="border border-neutral-300 px-6 py-3 text-sm font-medium transition hover:border-neutral-950"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}