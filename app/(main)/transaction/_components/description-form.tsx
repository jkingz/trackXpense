import type { FieldErrors, UseFormRegister } from "react-hook-form";

import type { TransactionFormValues } from "./add-transaction-form";

const DescriptionForm = ({
  register,
  errors,
}: {
  register: UseFormRegister<TransactionFormValues>;
  errors: FieldErrors<TransactionFormValues>;
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="description" className="text-sm text-muted-foreground">
        What for
      </label>
      <input
        id="description"
        placeholder="Weekend coffee"
        className="h-12 w-full rounded-xl border bg-card px-4 text-base outline-none placeholder:text-muted-foreground/60 focus-visible:border-indigo focus-visible:ring-2 focus-visible:ring-ring/40"
        {...register("description")}
      />
      {errors.description && (
        <p className="text-sm text-destructive">{errors.description.message}</p>
      )}
    </div>
  );
};

export default DescriptionForm;
