import type { FieldErrors, UseFormSetValue } from "react-hook-form";

import { cn } from "@/lib/utils";

import type { TransactionFormValues } from "./add-transaction-form";

const TypeForm = ({
  type,
  setValue,
  errors,
}: {
  type: string;
  setValue: UseFormSetValue<TransactionFormValues>;
  errors: FieldErrors<TransactionFormValues>;
}) => {
  return (
    <div>
      <div role="group" aria-label="Entry type" className="inline-flex rounded-xl bg-muted p-1">
        {(["EXPENSE", "INCOME"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={type === kind}
            onClick={() => {
              if (kind === type) return;
              setValue("type", kind);
              // A category belongs to one type; switching type clears it.
              setValue("category", "");
            }}
            className={cn(
              "h-10 rounded-lg px-5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring",
              type === kind
                ? "bg-navy text-white dark:bg-indigo"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {kind === "EXPENSE" ? "Expense" : "Income"}
          </button>
        ))}
      </div>
      {errors.type && <p className="mt-2 text-sm text-destructive">{errors.type.message}</p>}
    </div>
  );
};

export default TypeForm;
