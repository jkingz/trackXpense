import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { currentUser } from "@/actions/lib/checkUser";

/** App shell: route content in the page container. Signed-out visitors go to sign-in. */
const MainLayout = async ({ children }: { children: ReactNode }) => {
  if (!(await currentUser())) redirect("/sign-in");

  return <div className="container mx-auto px-4 py-10 md:py-12">{children}</div>;
};

export default MainLayout;
