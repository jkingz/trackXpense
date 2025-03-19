import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const SetDefaultForm = ({ getValues, setValue, isRecurring, errors }) => {
  return (
    <>
      <div className="flex items-center justify-between rounded-lg border p-3 gap-2">
        <div className="space-y-0.5">
          <label
            htmlFor="isDefault"
            className="font-medium text-sm cursor-pointer"
          >
            Recurring Transaction
          </label>
          <p className="text-sm text-muted-foreground">
            Set up a recurring schedule for this transaction.
          </p>
        </div>
        <Switch
          id="isDefault"
          onCheckedChange={(checked) => setValue('isRecurring', checked)}
          checked={isRecurring}
        ></Switch>
      </div>
      {isRecurring && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Recurring Interval</label>
          <Select
            onValueChange={(value) => setValue('recurringInterval', value)}
            defaultValue={getValues('recurringInterval')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select recurring Interval" />
            </SelectTrigger>
            <SelectContent className="w-full">
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {errors.recurringInterval && (
            <p className="text-sm text-red-500">
              {errors.recurringInterval.message}
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default SetDefaultForm;
