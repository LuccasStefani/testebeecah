export function normalizeCpf(
  value: string
) {
  return value.replace(/\D/g, "");
}

export function formatCpf(
  value: string
) {
  const digits =
    normalizeCpf(value).slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(
      3,
      6
    )}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(
    3,
    6
  )}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function isValidCpf(
  value: string
) {
  const cpf = normalizeCpf(value);

  if (cpf.length !== 11) {
    return false;
  }

  /*
   * CPFs formados pelo mesmo dígito
   * repetido não são válidos.
   */
  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  function calculateDigit(
    base: string,
    initialWeight: number
  ) {
    let sum = 0;

    for (
      let index = 0;
      index < base.length;
      index += 1
    ) {
      sum +=
        Number(base[index]) *
        (initialWeight - index);
    }

    const remainder =
      (sum * 10) % 11;

    return remainder === 10
      ? 0
      : remainder;
  }

  const firstDigit =
    calculateDigit(
      cpf.slice(0, 9),
      10
    );

  if (
    firstDigit !== Number(cpf[9])
  ) {
    return false;
  }

  const secondDigit =
    calculateDigit(
      cpf.slice(0, 10),
      11
    );

  return (
    secondDigit === Number(cpf[10])
  );
}