import { Input } from "@/components/ui/input";
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
      <label className="text-sm font-medium">Description</label>
      <Input placeholder="Enter description" {...register("description")} />
      {errors.description && (
        <p className="text-sm text-destructive">{errors.description.message}</p>
      )}
    </div>
  );
};

export default DescriptionForm;
