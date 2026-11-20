"use client";
import { format, isToday, isYesterday, startOfToday, subDays } from "date-fns";
import { useState } from "react";
import type { FieldErrors, UseFormSetValue } from "react-hook-form";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { TransactionFormValues } from "./add-transaction-form";

const segment =
  "h-10 flex-1 rounded-lg px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring";

const DateForm = ({
  date,
  errors,
  setValue,
}: {
  date: Date;
  errors: FieldErrors<TransactionFormValues>;
  setValue: UseFormSetValue<TransactionFormValues>;
}) => {
  const [open, setOpen] = useState(false);
  const value = date instanceof Date && !isNaN(date.getTime()) ? date : null;
  const which = !value
    ? null
    : isToday(value)
      ? "today"
      : isYesterday(value)
        ? "yesterday"
        : "pick";
  const pick = (next: Date | undefined) => setValue("date", next as Date, { shouldValidate: true });

  return (
    <div className="space-y-2">
      <span id="date-label" className="text-sm text-muted-foreground">
        When
      </span>
      <div role="group" aria-labelledby="date-label" className="flex rounded-xl border bg-card p-1">
        <button
          type="button"
          aria-pressed={which === "today"}
          onClick={() => pick(startOfToday())}
          className={cn(
            segment,
            which === "today" ? "bg-muted font-semibold" : "text-muted-foreground",
          )}
        >
          Today
        </button>
        <button
          type="button"
          aria-pressed={which === "yesterday"}
          onClick={() => pick(subDays(startOfToday(), 1))}
          className={cn(
            segment,
            which === "yesterday" ? "bg-muted font-semibold" : "text-muted-foreground",
          )}
        >
          Yesterday
        </button>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                aria-pressed={which === "pick"}
                className={cn(
                  segment,
                  which === "pick" ? "bg-muted font-semibold" : "text-muted-foreground",
                )}
              >
                {which === "pick" && value ? format(value, "d MMM") : "Pick…"}
              </button>
            }
          />
          <PopoverContent>
            <Calendar
              mode="single"
              selected={value ?? undefined}
              onSelect={(next) => {
                // Clearing yields undefined; the schema flags the missing date.
                pick(next);
                setOpen(false);
              }}
              disabled={(day) => day > new Date() || day < new Date("1900-01-01")}
            />
          </PopoverContent>
        </Popover>
      </div>
      {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
    </div>
  );
};

export default DateForm;
