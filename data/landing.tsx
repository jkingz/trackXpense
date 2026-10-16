import { Gauge, Landmark, LayoutDashboard, ScanLine, Tags } from "lucide-react";

export const featuresData = [
  {
    kind: "accounts",
    icon: <Landmark className="size-6 text-brand-deep" />,
    title: "Two accounts, two running balances",
    description:
      "Open a CURRENT account and a SAVINGS account. Every entry is marked income or expense, and the mark decides which way that balance moves.",
    span: "sm:col-span-2 lg:col-span-3",
  },
  {
    kind: "budget",
    icon: <Gauge className="size-6 text-brand-deep" />,
    title: "One budget, edited where you read it",
    description:
      "Set a single figure on the dashboard. A bar shows how far your logged expenses have climbed against it — no settings screen, no report to wait for.",
    span: "lg:col-span-3",
  },
  {
    kind: "categories",
    icon: <Tags className="size-6 text-brand-deep" />,
    title: "21 categories, ready on day one",
    description:
      "Groceries, Salary, Housing, Freelance. Every entry carries one, so the ledger says where the money went, not only how much.",
    span: "lg:col-span-2",
  },
  {
    kind: "receipt",
    icon: <ScanLine className="size-6 text-brand-deep" />,
    title: "Photograph the receipt",
    description:
      "On the add-transaction form a photo fills in amount, date, description and category before you type a word.",
    span: "lg:col-span-2",
  },
  {
    kind: "dashboard",
    icon: <LayoutDashboard className="size-6 text-brand-deep" />,
    title: "The dashboard is the log",
    description:
      "Budget bar on top, income and expenses beside it, one card per account. It reads back what you just entered.",
    span: "lg:col-span-2",
  },
];

export const howItWorksData = [
  {
    kind: "accounts",
    title: "Open an account",
    description:
      "One short form. Name it, say whether it is current or savings, give it a starting balance.",
    fields: ["Name", "Current or Savings", "Starting balance"],
  },
  {
    kind: "receipt",
    title: "Log an entry",
    description:
      "The same shape every time, so recording one cost never becomes a project of its own.",
    fields: ["Amount", "Income or Expense", "Category", "Date", "Description"],
  },
  {
    kind: "budget",
    title: "Read the result",
    description:
      "Sign in and the page answers the only two questions that matter: what is left, and how close the budget is.",
    fields: ["Balance per account", "Income against expenses", "Budget headroom"],
  },
];
