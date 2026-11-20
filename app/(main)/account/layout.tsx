import type { ReactNode } from "react";
import { format } from "date-fns";
import { connection } from "next/server";

import { getUserAccounts } from "@/actions/dashboard";

import { AppSidebar } from "@/app/(main)/_components/app-sidebar";

/** Account pages keep the rail that switches ledgers; the dashboard carries its own accounts card. */
const AccountLayout = async ({ children }: { children: ReactNode }) => {
  const accounts = await getUserAccounts();
  // Date the rail by the request, like the dashboard sections do.
  await connection();
  const today = format(new Date(), "EEE, d MMM");

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <AppSidebar accounts={accounts} today={today} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};

export default AccountLayout;
