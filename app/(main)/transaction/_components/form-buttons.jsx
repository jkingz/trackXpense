import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const FormButtons = ({ router, transactionLoading, editMode }) => {
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
        {transactionLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {editMode ? 'Updating...' : 'Creating...'}
          </>
        ) : editMode ? (
          'Update Transaction'
        ) : (
          'Create Transaction'
        )}
      </Button>
    </div>
  );
};

export default FormButtons;
