import { Input } from '@/components/ui/input';

const AmountForm = ({ register, errors, disabled = false }) => {
  return (
    <div className="space-y-2">
      <label
        htmlFor="amount"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Amount
      </label>
      <Input
        className="h-9"
        id="amount"
        type="number"
        step="0.01"
        placeholder="0.00"
        {...register('amount')}
        disabled={disabled} // Allow disabling from parent
        {...register('amount', {
          valueAsNumber: false, // Convert input string to number
        })}
      />
      {errors.amount && (
        <p className="text-sm text-red-500">{errors.amount.message}</p>
      )}
    </div>
  );
};

export default AmountForm;
