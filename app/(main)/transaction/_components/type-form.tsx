import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FieldErrors, UseFormSetValue } from "react-hook-form";

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
    <div className="space-y-2">
      <label className="text-sm font-medium">Type</label>
      <Select
        onValueChange={(value) =>
          setValue("type", (value ?? "EXPENSE") as TransactionFormValues["type"])
        }
        defaultValue={type}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="EXPENSE">Expense</SelectItem>
          <SelectItem value="INCOME">Income</SelectItem>
        </SelectContent>
      </Select>
      {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
    </div>
  );
};

export default TypeForm;
