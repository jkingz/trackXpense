import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { currentUser } from "@/actions/lib/checkUser";

import { CurrencyProvider } from "./_components/currency-context";

/** App shell: route content in the page container. Signed-out visitors go to sign-in. */
const MainLayout = async ({ children }: { children: ReactNode }) => {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <CurrencyProvider currency={user.currency}>
      <div className="container mx-auto px-4 py-10 md:py-12">{children}</div>
    </CurrencyProvider>
  );
};

export default MainLayout;
