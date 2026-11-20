// RFC 4180 quoting, plus a leading ' so spreadsheets don't run =+-@ cells as formulas.
export function csvField(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
