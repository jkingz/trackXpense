import { getUserAccounts } from '@/actions/dashboard';
import { defaultCategories } from '@/data/categories';
import AddTransactionForm from '../_components/add-transaction-form';

const AddTransaction = async () => {
  const accounts = await getUserAccounts();
  return (
    <div className="max-w-3xl mx-auto px-5">
      <h1 className="text-5xl --gradient-title">Add Transactions</h1>
      <AddTransactionForm accounts={accounts} categories={defaultCategories} />
    </div>
  );
};

export default AddTransaction;
