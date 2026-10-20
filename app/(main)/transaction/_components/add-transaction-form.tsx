"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createTransaction, updateTransaction } from "@/actions/transaction";
import type { defaultCategories } from "@/data/categories";
import useFetch from "@/hooks/use-fetch";
import { transactionSchema } from "@/lib/schema";
import type { TransactionInput } from "@/lib/schema";
import { cn } from "@/lib/utils";

import AccountsForm from "./accounts-form";
import AmountForm from "./amount-form";
import CategoriesForm from "./categories-form";
import DateForm from "./date-form";
import DescriptionForm from "./description-form";
import FormButtons from "./form-buttons";
import ReceiptScanner, { type ScannedReceipt } from "./scan-receipt";
import SetDefaultForm from "./set-default-form";
import TypeForm from "./type-form";

export type TransactionFormValues = z.input<typeof transactionSchema>;

export type SerializedAccount = {
  id: string;
  name: string;
  type: string;
  balance: number;
  isDefault: boolean;
};

type SerializedTransactionInput = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string | null;
  accountId: string;
  category: string;
  date: Date | string;
  isRecurring: boolean;
  recurringInterval?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | null;
};

const AddTransactionForm = ({
  accounts,
  categories,
  editMode = false,
  initialData = null,
  onSuccess,
  onCancel,
  stickyFooter = false,
}: {
  // getUserAccounts serializes rows, so balance is a number and _count is present; the serialized view needs its own type.
  accounts: SerializedAccount[];
  categories: typeof defaultCategories;
  editMode?: boolean;
  // initialData is getTransactionById's serialized row: amount arrives as a number, not z.input's string.
  initialData?: SerializedTransactionInput | null;
  // Hosted in a dialog the form closes itself instead of navigating away; the page leaves both undefined.
  onSuccess?: (accountId: string) => void;
  onCancel?: () => void;
  // Pins the actions to the bottom of the dialog's scroll area.
  stickyFooter?: boolean;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  // Inference is not untyped here: zodResolver binds the schema's input type onto
  // defaultValues, where create mode's `date: ''` is not a Date. Measured without <any>:
  // 24 errors project-wide, 1 here (TS2322 on defaultValues). Closing it needs a cast or
  // a behaviour change, so field-value typing waits for Plan B.
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
    reset,
  } = useForm<any>({
    resolver: zodResolver(transactionSchema),
    defaultValues:
      editMode && initialData
        ? {
            type: initialData.type,
            amount: initialData.amount.toString(),
            description: initialData.description,
            accountId: initialData.accountId,
            category: initialData.category,
            date: new Date(initialData.date),
            isRecurring: initialData.isRecurring,
            ...(initialData.recurringInterval && {
              recurringInterval: initialData.recurringInterval,
            }),
          }
        : {
            type: "EXPENSE",
            amount: "",
            description: "",
            accountId: accounts.find((ac) => ac.isDefault)?.id,
            date: "",
            isRecurring: false,
          },
  });

  const {
    loading: transactionLoading,
    data: transactionResult,
    fn: transactionFn,
  } = useFetch(
    editMode
      ? (data: TransactionInput) => updateTransaction(data, editId as string)
      : createTransaction,
  );

  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const date = watch("date");
  const categoryValue = watch("category");

  const filteredCategory = categories.filter((category) => category.type === type);

  const onSubmit = (data: TransactionFormValues) => {
    const formData = {
      ...data,
      amount: parseFloat(data.amount),
    };
    transactionFn(formData);
  };

  useEffect(() => {
    if (transactionResult?.success && !transactionLoading) {
      toast.success(
        editMode ? "Transaction updated successfully" : "Transaction created successfully",
      );
      reset();
      if (onSuccess) {
        onSuccess(transactionResult.data.accountId);
      } else {
        router.push(`/account/${transactionResult.data.accountId}`);
      }
    }
  }, [transactionResult, transactionLoading, editMode, router, reset, onSuccess]);

  // useCallback: ReceiptScanner's effect depends on this identity; an inline
  // definition would refire onScanComplete on every parent render.
  const handleScanComplete = useCallback(
    async (scannedData: ScannedReceipt) => {
      // Parse the scanned data and extract relevant information
      if (scannedData) {
        setValue("date", new Date(scannedData.date));
        setValue("amount", scannedData.amount.toString());
        if (scannedData.description) {
          setValue("description", scannedData.description);
        }
        if (scannedData.category) {
          setValue("category", scannedData.category);
        }
        if (scannedData.receiptUrl) {
          setValue("receiptUrl", scannedData.receiptUrl);
        }
      }
    },
    [setValue],
  );

  return (
    <div>
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Receipt Scan */}
        {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}

        <TypeForm type={type} setValue={setValue} errors={errors} />
        <div className="grid md:grid-cols-2 gap-6">
          <AmountForm register={register} errors={errors} />
          <AccountsForm
            accounts={accounts}
            setValue={setValue}
            getValues={getValues}
            errors={errors}
          />
        </div>
        <CategoriesForm
          categories={filteredCategory}
          setValue={setValue}
          category={categoryValue}
          errors={errors}
        />
        <DateForm date={date} setValue={setValue} errors={errors} />
        <DescriptionForm register={register} errors={errors} />
        <SetDefaultForm
          setValue={setValue}
          isRecurring={isRecurring}
          getValues={getValues}
          errors={errors}
        />
        <div
          className={cn(
            "grid grid-cols-2 md:grid-cols-2 gap-4",
            stickyFooter && "sticky bottom-0 z-10 -mx-5 border-t bg-background px-5 py-4",
          )}
        >
          <FormButtons
            router={router}
            transactionLoading={transactionLoading}
            editMode={editMode}
            onCancel={onCancel}
          />
        </div>
      </form>
    </div>
  );
};

export default AddTransactionForm;
