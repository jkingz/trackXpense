import { Button } from "@/components/ui/button";

const FormButtons = ({
  router,
  transactionLoading,
  editMode,
}: {
  router: { back: () => void };
  transactionLoading: boolean;
  editMode: boolean;
}) => {
  return (
    <div className="flex gap-4">
      <Button
        type="button"
        variant="outline"
        onClick={() => router.back()}
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
