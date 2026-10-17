import type { ReactNode } from "react";
import { format } from "date-fns";
import { connection } from "next/server";

import { redirect } from "next/navigation";

import { getUserAccounts } from "@/actions/dashboard";
import { currentUser } from "@/actions/lib/checkUser";

import { AppSidebar } from "./_components/app-sidebar";

/** App shell: rail on the left, route content on the right. Signed-out visitors go to sign-in. */
const MainLayout = async ({ children }: { children: ReactNode }) => {
  if (!(await currentUser())) redirect("/sign-in");
  const accounts = await getUserAccounts();
  // Date the shell by the request, like the dashboard sections do.
  await connection();
  const today = format(new Date(), "EEE, d MMM");

  return (
    <div className="container mx-auto flex flex-col gap-8 py-10 md:py-12 lg:flex-row">
      <AppSidebar accounts={accounts} today={today} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};

export default MainLayout;
