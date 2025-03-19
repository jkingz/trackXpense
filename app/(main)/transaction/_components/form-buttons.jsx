import { Button } from '@/components/ui/button';

const FormButtons = ({ router, transactionLoading }) => {
  return (
    <div className="flex gap-4">
      <Button
        type="button"
        variant="outline"
        onClick={() => router.back()}
        className="w-full"
      >
        Cancel
      </Button>
      <Button type="submit" disabled={transactionLoading} className="w-full">
        Create Transaction
      </Button>
    </div>
  );
};

export default FormButtons;
