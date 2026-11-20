"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { useCallback, useContext, useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createTransaction, updateTransaction } from "@/actions/transaction";
import { CurrencyContext } from "@/app/(main)/_components/currency-context";
import type { defaultCategories } from "@/data/categories";
import useFetch from "@/hooks/use-fetch";
import { formatMoney } from "@/lib/money";
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
  aside,
  budgetLeft = null,
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
  // Page mode: the headline column; turns on the two-column layout and the save preview.
  aside?: ReactNode;
  // What is left of this month's budget on the default account, for the preview.
  budgetLeft?: number | null;
}) => {
  const router = useRouter();
  const currency = useContext(CurrencyContext);
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  // Inference is not untyped here: zodResolver binds the schema's input type onto
  // defaultValues, which create mode's empty fields do not satisfy. Measured without <any>:
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
            date: new Date(),
            category: "",
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
  const accountId = watch("accountId");
  const amountValue = Number(watch("amount")) || 0;
  const description = watch("description");

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
      } else if (!editMode) {
        router.push(`/dashboard?saved=${transactionResult.data.id}`);
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

  const account = accounts.find((item) => item.id === accountId);
  const signed = type === "EXPENSE" ? -amountValue : amountValue;
  const showBudget = budgetLeft !== null && type === "EXPENSE" && Boolean(account?.isDefault);

  const form = (
    <form
      className={cn("space-y-7", aside && "offset-shadow rounded-3xl border bg-card p-6 sm:p-10")}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TypeForm type={type} setValue={setValue} errors={errors} />
        {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}
      </div>

      <AmountForm register={register} errors={errors} />

      <hr className="border-dashed" />

      <CategoriesForm
        categories={filteredCategory}
        setValue={setValue}
        category={categoryValue}
        errors={errors}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <AccountsForm
          accounts={accounts}
          setValue={setValue}
          accountId={accountId}
          errors={errors}
        />
        <DateForm date={date} setValue={setValue} errors={errors} />
      </div>

      <DescriptionForm register={register} errors={errors} />

      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-4 border-t border-dashed pt-6",
          stickyFooter && "sticky bottom-0 z-10 -mx-5 bg-background px-5 py-4",
        )}
      >
        <SetDefaultForm
          setValue={setValue}
          isRecurring={isRecurring}
          getValues={getValues}
          errors={errors}
        />
        <FormButtons
          router={router}
          transactionLoading={transactionLoading}
          editMode={editMode}
          onCancel={onCancel}
        />
      </div>
    </form>
  );

  if (!aside) return form;

  return (
    <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-5 lg:pt-6">
        {aside}
        {!editMode && account && (
          <div className="mt-14 hidden lg:block" aria-live="polite">
            <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              After you save
            </p>
            <div className="offset-shadow mt-4 max-w-sm -rotate-1 rounded-2xl border-2 border-navy bg-lime p-5 text-navy">
              <p className="flex items-center gap-2 font-semibold">
                <CircleCheck aria-hidden className="size-5 fill-navy text-lime" />
                {description?.trim() || "Entry"} saved
              </p>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt>{account.name}</dt>
                  <dd className="font-mono tabular-nums">
                    {amountValue > 0 && (
                      <s className="mr-2 opacity-70">{formatMoney(account.balance, currency)}</s>
                    )}
                    {formatMoney(account.balance + signed, currency)}
                  </dd>
                </div>
                {showBudget && (
                  <div className="flex justify-between gap-4">
                    <dt>Budget left</dt>
                    <dd className="font-mono tabular-nums">
                      {formatMoney((budgetLeft ?? 0) - amountValue, currency)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Highlighted on the dashboard when you land there.
            </p>
          </div>
        )}
      </div>
      <div className="lg:col-span-7">{form}</div>
    </div>
  );
};

export default AddTransactionForm;
