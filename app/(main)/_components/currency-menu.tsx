"use client";

import { ChevronDown } from "lucide-react";
import { useContext } from "react";
import { toast } from "sonner";

import { updateLedgerCurrency } from "@/actions/currency";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useFetch from "@/hooks/use-fetch";
import { ledgerCurrencies } from "@/lib/money";

import { CurrencyContext } from "./currency-context";

const currencyLabels = {
  PHP: "Philippine peso",
  USD: "US dollar",
};

export function CurrencyMenu() {
  const currency = useContext(CurrencyContext);
  const { fn: updateCurrency, loading } = useFetch(updateLedgerCurrency);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" />}
        aria-label={`Ledger currency: ${currency}`}
        disabled={loading}
      >
        {currency}
        <ChevronDown data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Ledger currency</DropdownMenuLabel>
          <p className="px-2 pb-2 text-xs text-muted-foreground">
            Changing currency keeps amounts as entered.
          </p>
          <DropdownMenuRadioGroup
            value={currency}
            onValueChange={async (value) => {
              if (value === currency) return;
              const result = await updateCurrency(value);
              if (result?.error) toast.error(result.error);
            }}
          >
            {ledgerCurrencies.map((code) => (
              <DropdownMenuRadioItem key={code} value={code} closeOnClick>
                {code} · {currencyLabels[code]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
