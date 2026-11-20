import type { ReactNode } from "react";
import { format } from "date-fns";
import { connection } from "next/server";

import { redirect } from "next/navigation";

import { getUserAccounts } from "@/actions/dashboard";
import { currentUser } from "@/actions/lib/checkUser";

import { AppSidebar } from "./_components/app-sidebar";
import { CurrencyProvider } from "./_components/currency-context";

/** App shell: rail on the left, route content on the right. Signed-out visitors go to sign-in. */
const MainLayout = async ({ children }: { children: ReactNode }) => {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const accounts = await getUserAccounts();
  // Date the shell by the request, like the dashboard sections do.
  await connection();
  const today = format(new Date(), "EEE, d MMM");

  return (
    <CurrencyProvider currency={user.currency}>
      <div className="daily-ledger flex-1 bg-background text-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:gap-6 lg:py-8">
          <AppSidebar accounts={accounts} today={today} />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </CurrencyProvider>
  );
};

export default MainLayout;
