import { getCurrentBudget } from '@/actions/budget';
import { getUserAccounts } from '@/actions/dashboard';
import CreateAccountDrawer from '@/components/create-account-drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import AccountCard from './_components/account-card';
import BudgetProgress from './_components/budget-progress';

const DashBoardPage = async () => {
  const accounts = await getUserAccounts();

  // find default account
  const defaultAccount = accounts?.find((account) => account.isDefault);
  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }
  return (
    <div className="space-y-8">
      {/* {Budgets} */}
      {defaultAccount && (
        <BudgetProgress
          initialBudget={budgetData?.budget}
          currentExpenses={budgetData?.currentExpenses || 0}
        />
      )}
      {/* {Account Grid} */}
      <div className="grid  md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-full pt-5 text-muted-foreground">
              <Plus className="h-10 w-10 mb-2"></Plus>
              <p className="text-sm font-medium">Add new account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>
        {accounts.length > 0 &&
          accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
      </div>
    </div>
  );
};

export default DashBoardPage;
