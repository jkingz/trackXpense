const DashBoardLayout = ({ children }: { children: React.ReactNode }) => {
  // No page title here: the balance hero is the page's lead. The flag hides the
  // landing aurora so the dashboard sits on a flat canvas.
  return <div data-flat-canvas>{children}</div>;
};

export default DashBoardLayout;
