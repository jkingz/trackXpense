import { useContext } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { CurrencyContext } from "@/app/(main)/_components/currency-context";
import { currencySymbol } from "@/lib/money";

import type { TransactionFormValues } from "./add-transaction-form";

const AmountForm = ({
  register,
  errors,
  disabled = false,
}: {
  register: UseFormRegister<TransactionFormValues>;
  errors: FieldErrors<TransactionFormValues>;
  disabled?: boolean;
}) => {
  const currency = useContext(CurrencyContext);
  return (
    <div className="space-y-2">
      <label htmlFor="amount" className="text-sm text-muted-foreground">
        Amount · {currency}
      </label>
      <div className="flex items-baseline gap-1 rounded-xl px-1 font-mono text-5xl focus-within:outline-2 focus-within:outline-ring sm:text-6xl">
        <span aria-hidden className="text-indigo-soft">
          {currencySymbol[currency]}
        </span>
        <input
          id="amount"
          type="number"
          step="0.01"
          inputMode="decimal"
          placeholder="0.00"
          disabled={disabled}
          aria-invalid={Boolean(errors.amount)}
          className="w-full min-w-0 bg-transparent py-2 tabular-nums outline-none placeholder:text-muted-foreground/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          {...register("amount")}
        />
      </div>
      {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
    </div>
  );
};

export default AmountForm;
