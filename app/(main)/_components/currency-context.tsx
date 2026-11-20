"use client";

import { createContext, type ReactNode } from "react";

import { defaultCurrency, type LedgerCurrency } from "@/lib/money";

export const CurrencyContext = createContext<LedgerCurrency>(defaultCurrency);

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: LedgerCurrency;
  children: ReactNode;
}) {
  return <CurrencyContext.Provider value={currency}>{children}</CurrencyContext.Provider>;
}
