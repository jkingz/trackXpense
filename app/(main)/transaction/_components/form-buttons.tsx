import { Button } from "@/components/ui/button";

const FormButtons = ({
  router,
  transactionLoading,
  editMode,
  onCancel,
}: {
  router: { back: () => void };
  transactionLoading: boolean;
  editMode: boolean;
  // In the dialog the cancel control closes the modal; the page falls back to history.
  onCancel?: () => void;
}) => {
  return (
    <div className="flex gap-4">
      <Button
        type="button"
        variant="outline"
        onClick={() => (onCancel ? onCancel() : router.back())}
        className="w-full"
        disabled={transactionLoading}
      >
        Cancel
      </Button>
      <Button type="submit" loading={transactionLoading} className="w-full">
        {transactionLoading
          ? editMode
            ? "Updating"
            : "Creating"
          : editMode
            ? "Update Transaction"
            : "Create Transaction"}
      </Button>
    </div>
  );
};

export default FormButtons;
