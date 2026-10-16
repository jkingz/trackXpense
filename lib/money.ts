/**
 * Every figure the app prints goes through here so the dashboard, the account
 * page and the ledger preview agree on grouping, decimals and the currency sign.
 * Direction (+ / −) is added by the caller, because it is meaning, not format.
 */
export function usd(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * A balance carries its own sign, and the sign belongs before the currency sign:
 * an overdrawn account reads −$1,234.00, not $-1,234.00.
 */
export function signedUsd(value: number): string {
  // Rounding first: a sub-cent negative prints as $0.00, and a zero should not
  // carry a direction the number it rounds to does not have.
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  return `${value < 0 && rounded > 0 ? "−" : ""}$${usd(rounded)}`;
}
