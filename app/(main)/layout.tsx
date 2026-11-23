import { ViewTransition, type ReactNode } from "react";

import { redirect } from "next/navigation";

import { getUserAccounts } from "@/actions/dashboard";
import { currentUser } from "@/actions/lib/checkUser";
import { MobileTabBar } from "@/components/mobile-tab-bar";

import { CurrencyProvider } from "./_components/currency-context";

/** App shell: route content in the page container. Signed-out visitors go to sign-in. */
const MainLayout = async ({ children }: { children: ReactNode }) => {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const defaultAccount = (await getUserAccounts()).find((account) => account.isDefault);

  return (
    <CurrencyProvider currency={user.currency}>
      <ViewTransition default="none" update={{ "ledger-budget": "ledger-budget", default: "none" }}>
        <div className="container mx-auto px-4 py-6 md:py-12">{children}</div>
      </ViewTransition>
      <MobileTabBar ledgerHref={defaultAccount ? `/account/${defaultAccount.id}` : null} />
    </CurrencyProvider>
  );
};

export default MainLayout;
