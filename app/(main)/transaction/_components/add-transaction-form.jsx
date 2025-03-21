'use client';
import { createTransaction, updateTransaction } from '@/actions/transaction';
import { transactionSchema } from '@/lib/schema';

import useFetch from '@/hooks/use-fetch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import AccountsForm from './accounts-form';
import AmountForm from './amount-form';
import CategoriesForm from './categories-form';
import DateForm from './date-form';
import DescriptionForm from './description-form';
import FormButtons from './form-buttons';
import ReceiptScanner from './scan-receipt';
import SetDefaultForm from './set-default-form';
import TypeForm from './type-form';

const AddTransactionForm = ({
  accounts,
  categories,
  editMode = false,
  initialData = null,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
    reset,
  } = useForm({
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
  } = useFetch(editMode ? updateTransaction : createTransaction);

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
    if (editMode) {
      transactionFn(formData, editId);
    } else {
      transactionFn(formData);
    }
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
            register={register}
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
