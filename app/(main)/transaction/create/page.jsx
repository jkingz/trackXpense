import { getUserAccounts } from '@/actions/dashboard';
import { getTransactionById } from '@/actions/transaction';
import { defaultCategories } from '@/data/categories';
import { checkUser } from '@/lib/checkUser';
import AddTransactionForm from '../_components/add-transaction-form';

const AddTransaction = async ({ searchParams }) => {
  await checkUser(); // Redirects if not authenticated
  const accounts = await getUserAccounts();
  const resolvedSearchParams = await searchParams;
  const editId = await resolvedSearchParams?.edit;

  let initialData = null;
  if (editId) {
    const transaction = await getTransactionById(editId);
    initialData = transaction;
  }

  return (
    <div className="max-w-3xl mx-auto px-5">
      <h1 className="text-5xl --gradient-title">
        {editId ? 'Edit' : 'Add'} Transactions
      </h1>
      <AddTransactionForm
        accounts={accounts}
        categories={defaultCategories}
        editMode={!!editId}
        initialData={initialData}
      />
    </div>
  );
};

export default AddTransaction;
