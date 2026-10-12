import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


const CategoriesForm = ({ categories, setValue, getValues, errors }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Category</label>
      <Select
        onValueChange={(value) => setValue('category', value)}
        defaultValue={getValues('category')}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent className="w-full">
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors.category && (
        <p className="text-sm text-red-500">{errors.category.message}</p>
      )}
    </div>
  );
};

export default CategoriesForm;
