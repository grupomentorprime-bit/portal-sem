/** Bancos habituales para una transferencia en Chile. */
export const CONGRESS_TRANSFER_BANKS = [
  "BancoEstado",
  "Banco de Chile",
  "Banco Santander",
  "BCI",
  "Scotiabank",
  "Banco Itaú",
  "Banco BICE",
  "Banco Security",
  "Banco Falabella",
  "Banco Ripley",
  "Banco Consorcio",
  "Banco Internacional",
  "HSBC",
  "BTG Pactual",
  "Coopeuch",
  "Tenpo",
  "Mercado Pago",
] as const;

export type CongressTransferBank = (typeof CONGRESS_TRANSFER_BANKS)[number];

const BANK_BY_KEY = new Map<string, CongressTransferBank>(
  CONGRESS_TRANSFER_BANKS.map((bank) => [bank.toLowerCase(), bank])
);

export const CONGRESS_PAYMENT_NOTE_MAX = 200;

export function normalizeCongressTransferBank(
  value: string | null | undefined
): CongressTransferBank | null {
  const text = value?.trim().toLowerCase() ?? "";
  if (!text) return null;
  return BANK_BY_KEY.get(text) ?? null;
}

export function congressTransferBankOptions(): Array<{ value: string; label: string }> {
  return [
    { value: "", label: "Seleccionar banco…" },
    ...CONGRESS_TRANSFER_BANKS.map((bank) => ({ value: bank, label: bank })),
  ];
}

export function normalizeCongressPaymentNote(
  value: string | null | undefined
): string | null {
  const text = value?.trim() ?? "";
  if (!text) return null;
  return text.slice(0, CONGRESS_PAYMENT_NOTE_MAX);
}
