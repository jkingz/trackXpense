'use client'; // Ensure this is a client component
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

const DateForm = ({ date, errors, setValue }) => {
  const [open, setOpen] = useState(false); // Control popover state

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Date</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full pl-3 text-left font-normal"
            onClick={() => setOpen(true)} // Optional: ensure click opens it
          >
            {date ? format(date, 'PPP') : <span>Pick a date</span>}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              setValue('date', selectedDate); // Update form value
              setOpen(false); // Close popover
            }}
            disabled={(date) =>
              date > new Date() || date < new Date('1900-01-01')
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {errors.date && (
        <p className="text-sm text-red-500">{errors.date.message}</p>
      )}
    </div>
  );
};

export default DateForm;
