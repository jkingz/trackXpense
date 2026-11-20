import { getCurrentBudget } from "@/actions/budget";
import { getUserAccounts } from "@/actions/dashboard";
import { requireUser } from "@/actions/lib/checkUser";
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
  // Before its data work: a signed-out visitor is sent to sign-in instead of
  // rendering a page whose first read throws.
  await requireUser();
  const accounts = await getUserAccounts();
  const resolvedSearchParams = await searchParams;
  const editId = resolvedSearchParams?.edit;

  let initialData: any = null;
  if (editId) {
    const transaction = await getTransactionById(editId);
    initialData = transaction;
  }

  const defaultAccount = accounts.find((account: any) => account.isDefault);
  const budget = defaultAccount ? await getCurrentBudget(defaultAccount.id) : null;
  const budgetLeft = budget?.budget ? budget.budget.amount - budget.currentExpenses : null;

  return (
    <div data-flat-canvas className="mx-auto max-w-6xl">
      <AddTransactionForm
        accounts={accounts}
        categories={defaultCategories}
        editMode={!!editId}
        initialData={initialData}
        budgetLeft={budgetLeft}
        aside={
          <>
            <p className="font-mono text-xs tracking-widest text-indigo uppercase dark:text-indigo-soft">
              {editId ? "Edit entry" : "New entry"}
            </p>
            <h1 className="mt-5 text-5xl font-extrabold tracking-tighter sm:text-6xl">
              {editId ? "Fix it while it's fresh." : "Log it while it's fresh."}
            </h1>
            <p className="mt-6 max-w-sm text-lg text-muted-foreground">
              Amount first, then a tap for category. Your balance and budget move the moment you
              save.
            </p>
          </>
        }
      />
    </div>
  );
};

export default AddTransaction;
