"use client"; // Ensure this is a client component
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FieldErrors, UseFormSetValue } from "react-hook-form";

import type { TransactionFormValues } from "./add-transaction-form";

const DateForm = ({
  date,
  errors,
  setValue,
}: {
  date: Date;
  errors: FieldErrors<TransactionFormValues>;
  setValue: UseFormSetValue<TransactionFormValues>;
}) => {
  const [open, setOpen] = useState(false); // Control popover state

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Date</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="w-full pl-3 text-left font-normal"
              onClick={() => setOpen(true)} // Optional: ensure click opens it
            >
              {date ? format(date, "PPP") : <span>Pick a date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          }
        />
        <PopoverContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => {
              // Clearing the calendar yields undefined; the schema flags the
              // missing date, so pass it through rather than inventing one.
              setValue("date", date as Date); // Update form value
              setOpen(false); // Close popover
            }}
            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
          />
        </PopoverContent>
      </Popover>

      {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
    </div>
  );
};

export default DateForm;
