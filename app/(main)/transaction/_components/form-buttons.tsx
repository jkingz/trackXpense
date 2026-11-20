import { CornerDownLeft } from "lucide-react";

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
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="ghost"
        onClick={() => (onCancel ? onCancel() : router.back())}
        disabled={transactionLoading}
        className="h-11 px-5"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        loading={transactionLoading}
        className="h-12 rounded-xl px-7 text-base font-semibold"
      >
        {editMode ? "Update" : "Log it"}
        <CornerDownLeft aria-hidden className="size-4" />
      </Button>
    </div>
  );
};

export default FormButtons;
