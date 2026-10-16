const DashBoardLayout = ({ children }: { children: React.ReactNode }) => {
  // No page title here: ./page.tsx renders the ledger header, because it carries
  // the account count and the month the figures belong to.
  return <div className="px-5">{children}</div>;
};

export default DashBoardLayout;
