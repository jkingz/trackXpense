'use client';
import { createTransaction, updateTransaction } from '@/actions/transaction';
import { transactionSchema } from '@/lib/schema';

import useFetch from '@/hooks/use-fetch';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Account } from '@prisma/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

import type { defaultCategories } from '@/data/categories';
import AccountsForm from './accounts-form';
import AmountForm from './amount-form';
import CategoriesForm from './categories-form';
import DateForm from './date-form';
import DescriptionForm from './description-form';
import FormButtons from './form-buttons';
import ReceiptScanner from './scan-receipt';
import SetDefaultForm from './set-default-form';
import TypeForm from './type-form';

type TransactionFormValues = z.input<typeof transactionSchema>;

const AddTransactionForm = ({
  accounts,
  categories,
  editMode = false,
  initialData = null,
}: {
  // getUserAccounts serializes rows, so balance is a number and _count is present; the serialized view needs its own type.
  accounts: Account[];
  categories: typeof defaultCategories;
  editMode?: boolean;
  // initialData is getTransactionById's serialized row: amount arrives as a number, not z.input's string.
  initialData?: TransactionFormValues | null;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            type: 'EXPENSE',
            amount: '',
            description: '',
            accountId: accounts.find((ac) => ac.isDefault)?.id,
            date: '',
            isRecurring: false,
          },
  });

  const {
    loading: transactionLoading,
    data: transactionResult,
    fn: transactionFn,
  } = useFetch(editMode ? (data) => updateTransaction(data, editId) : createTransaction);

  const type = watch('type');
  const isRecurring = watch('isRecurring');
  const date = watch('date');

  const filteredCategory = categories.filter(
    (category) => category.type === type
  );

  const onSubmit = (data) => {
    const formData = {
      amount: parseFloat(data.amount),
      ...data,
    };
    transactionFn(formData);
  };

  useEffect(() => {
    if (transactionResult?.success && !transactionLoading) {
      toast.success(
        editMode
          ? 'Transaction updated successfully'
          : 'Transaction created successfully'
      );
      reset();
      router.push(`/account/${transactionResult.data.accountId}`);
    }
  }, [transactionResult, transactionLoading, editMode, router, reset]);

  const handleScanComplete = async (scannedData) => {
    // Parse the scanned data and extract relevant information
    if (scannedData) {
      setValue('date', new Date(scannedData.date));
      setValue('amount', scannedData.amount.toString());
      if (scannedData.description) {
        setValue('description', scannedData.description);
      }
      if (scannedData.category) {
        setValue('category', scannedData.category);
      }
    }
  };

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
          getValues={getValues}
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
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <FormButtons
            router={router}
            transactionLoading={transactionLoading}
            editMode={editMode}
          />
        </div>
      </form>
    </div>
  );
};

export default AddTransactionForm;
