import { Input } from '@/components/ui/input';

const DescriptionForm = ({ register, errors }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Description</label>
      <Input placeholder="Enter description" {...register('description')} />
      {errors.description && (
        <p className="text-sm text-red-500">{errors.description.message}</p>
      )}
    </div>
  );
};

export default DescriptionForm;
