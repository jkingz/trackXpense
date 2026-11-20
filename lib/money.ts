export const ledgerCurrencies = ["PHP", "USD"] as const;

export type LedgerCurrency = (typeof ledgerCurrencies)[number];

export const defaultCurrency: LedgerCurrency = "PHP";

const formatters = {
  PHP: new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }),
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
};

// For layouts that set the symbol apart from the digits (amount inputs).
export const currencySymbol: Record<LedgerCurrency, string> = { PHP: "₱", USD: "$" };

export function formatMoney(value: number, currency: LedgerCurrency) {
  const amount = formatters[currency].format(Math.abs(value));
  return value <= -0.005 ? `−${amount}` : amount;
}
