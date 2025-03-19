import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TypeForm = ({ type, setValue, errors }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Type</label>
      <Select
        onValueChange={(value) => setValue('type', value)}
        defaultValue={type}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="EXPENSE">Expense</SelectItem>
          <SelectItem value="INCOME">Income</SelectItem>
        </SelectContent>
      </Select>
      {errors.type && (
        <p className="text-sm text-red-500">{errors.type.message}</p>
      )}
    </div>
  );
};

export default TypeForm;
