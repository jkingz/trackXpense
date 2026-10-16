import { getUserAccounts } from "@/actions/dashboard";
import { getTransactionById } from "@/actions/transaction";
import { defaultCategories } from "@/data/categories";

import AddTransactionForm from "../_components/add-transaction-form";

// Reads the ledger on every request, so it cannot be prerendered: opt out of
// instant prerendering, which cannot complete without request data.
export const instant = false;

const AddTransaction = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) => {
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
      <h1 className="mb-8 border-b pb-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {editId ? "Edit transaction" : "Add a transaction"}
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
