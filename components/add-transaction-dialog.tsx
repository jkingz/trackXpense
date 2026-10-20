"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";

import AddTransactionForm, {
  type SerializedAccount,
} from "@/app/(main)/transaction/_components/add-transaction-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { defaultCategories } from "@/data/categories";

/**
 * Modal entry point for logging an entry without leaving the current screen.
 * The create page still exists for deep links and for edit mode; this form is
 * the same component, so both paths validate and submit identically.
 */
export function AddTransactionDialog({
  accounts,
  children,
}: {
  accounts: SerializedAccount[];
  children: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 border-b px-5 py-4 pr-12">
          <DialogTitle>Add a transaction</DialogTitle>
          <DialogDescription>Log an entry and pick the account it belongs to.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4">
          <AddTransactionForm
            accounts={accounts}
            categories={defaultCategories}
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
            stickyFooter
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddTransactionDialog;
