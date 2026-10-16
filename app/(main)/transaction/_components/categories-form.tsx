import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { defaultCategories } from "@/data/categories";
import type { FieldErrors, UseFormSetValue } from "react-hook-form";

import type { TransactionFormValues } from "./add-transaction-form";

const CategoriesForm = ({
  categories,
  setValue,
  errors,
  category,
}: {
  categories: typeof defaultCategories;
  setValue: UseFormSetValue<TransactionFormValues>;
  errors: FieldErrors<TransactionFormValues>;
  // Controlled: the receipt scan writes `category` after mount, and Base UI's
  // `defaultValue` is read once, so an uncontrolled trigger would keep showing
  // "Select category" while the form already holds the scanned value.
  category?: string;
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Category</label>
      {/* `null` is Base UI's empty sentinel: it keeps the trigger controlled from the
          first render (undefined would flip it) and still renders the placeholder.
          `items` lets the closed trigger show "Groceries" for the scanned id "groceries" —
          the options themselves are not mounted until the popup opens. */}
      <Select
        value={category ?? null}
        items={categories.map((opt) => ({ label: opt.name, value: opt.id }))}
        onValueChange={(value) => setValue("category", value ?? "")}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent className="w-full">
          {categories.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
    </div>
  );
};

export default CategoriesForm;
