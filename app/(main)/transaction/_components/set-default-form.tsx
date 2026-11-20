import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { FieldErrors, UseFormGetValues, UseFormSetValue } from "react-hook-form";

import type { TransactionFormValues } from "./add-transaction-form";

const INTERVALS = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

const SetDefaultForm = ({
  getValues,
  setValue,
  isRecurring,
  errors,
}: {
  getValues: UseFormGetValues<TransactionFormValues>;
  setValue: UseFormSetValue<TransactionFormValues>;
  isRecurring: boolean;
  errors: FieldErrors<TransactionFormValues>;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Switch
        id="isRecurring"
        onCheckedChange={(checked) => setValue("isRecurring", checked)}
        checked={isRecurring}
      />
      <label htmlFor="isRecurring" className="cursor-pointer text-sm">
        Repeat this entry
      </label>
      {isRecurring && (
        <Select
          items={INTERVALS}
          onValueChange={(value) =>
            setValue(
              "recurringInterval",
              (value ?? undefined) as TransactionFormValues["recurringInterval"],
            )
          }
          defaultValue={getValues("recurringInterval")}
        >
          <SelectTrigger aria-label="Repeat interval" className="h-9 rounded-lg">
            <SelectValue placeholder="How often" />
          </SelectTrigger>
          <SelectContent>
            {INTERVALS.map((interval) => (
              <SelectItem key={interval.value} value={interval.value}>
                {interval.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {errors.recurringInterval && (
        <p className="w-full text-sm text-destructive">{errors.recurringInterval.message}</p>
      )}
    </div>
  );
};

export default SetDefaultForm;
