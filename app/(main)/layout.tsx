import type { ReactNode } from "react";

const MainLayout = ({ children }: { children: ReactNode }) => {
  return <div className="container mx-auto py-10 md:py-12">{children}</div>;
};

export default MainLayout;
