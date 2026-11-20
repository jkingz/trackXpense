import { ArrowRight } from "lucide-react";
import type { FieldErrors, UseFormSetValue } from "react-hook-form";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import type { defaultCategories } from "@/data/categories";
import { cn } from "@/lib/utils";

import type { TransactionFormValues } from "./add-transaction-form";

const QUICK = 6;

const CategoriesForm = ({
  categories,
  setValue,
  errors,
  category,
}: {
  categories: typeof defaultCategories;
  setValue: UseFormSetValue<TransactionFormValues>;
  errors: FieldErrors<TransactionFormValues>;
  // Controlled: the receipt scan writes `category` after mount.
  category?: string;
}) => {
  // The first six are one tap away; a pick from "All" joins the row so it shows selected.
  const quick = categories.slice(0, QUICK);
  const picked = categories.find((item) => item.id === category);
  const chips = picked && !quick.includes(picked) ? [...quick, picked] : quick;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <span id="category-label" className="text-sm text-muted-foreground">
          Category
        </span>
        {/* `null` keeps the select controlled from the first render. */}
        <Select
          value={category || null}
          items={categories.map((opt) => ({ label: opt.name, value: opt.id }))}
          onValueChange={(value) => setValue("category", value ?? "")}
        >
          <SelectTrigger
            aria-label="All categories"
            className="h-auto gap-1 border-0 p-0 text-sm font-semibold text-indigo shadow-none dark:bg-transparent dark:text-indigo-soft dark:hover:bg-transparent [&>svg:last-child]:hidden"
          >
            All {categories.length} <ArrowRight aria-hidden className="size-3.5 text-current" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div role="group" aria-labelledby="category-label" className="flex flex-wrap gap-2">
        {chips.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={category === item.id}
            onClick={() =>
              setValue("category", item.id, { shouldValidate: Boolean(errors.category) })
            }
            className={cn(
              "h-10 rounded-full border px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              category === item.id
                ? "border-indigo bg-indigo font-semibold text-white"
                : "bg-card hover:border-indigo/50",
            )}
          >
            {item.name}
          </button>
        ))}
      </div>
      {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
    </div>
  );
};

export default CategoriesForm;
