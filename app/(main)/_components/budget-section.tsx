import { differenceInCalendarDays, endOfMonth, format } from "date-fns";

import { getCurrentBudget } from "@/actions/budget";
import BudgetProgress from "@/app/(main)/dashboard/_components/budget-progress";

export async function BudgetSection({ accountId, now }: { accountId: string; now: Date }) {
  const { budget, currentExpenses } = await getCurrentBudget(accountId);

  return (
    <BudgetProgress
      initialBudget={budget}
      currentExpenses={currentExpenses}
      monthName={format(now, "MMMM")}
      daysLeft={differenceInCalendarDays(endOfMonth(now), now)}
    />
  );
}
