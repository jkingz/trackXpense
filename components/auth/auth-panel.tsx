import { Gauge, Landmark, Tags } from "lucide-react";

const PROPS = [
  {
    icon: Landmark,
    title: "Two accounts, two running balances",
    description:
      "Current and Savings side by side. Every entry is income or expense, and that mark decides which way the balance moves.",
  },
  {
    icon: Gauge,
    title: "One budget, read where you log",
    description:
      "Set a single figure on the dashboard and watch the bar climb as your expenses land against it.",
  },
  {
    icon: Tags,
    title: "21 categories on day one",
    description:
      "Groceries, Salary, Housing, Freelance — so the ledger says where the money went, not only how much.",
  },
] as const;

/**
 * The left half of both auth routes: what the product is, before anyone types.
 * Copy is taken from `data/landing.tsx` so the pitch cannot drift from the
 * landing page's own claims. No numbers here that the repo cannot back.
 */
export function AuthPanel() {
  return (
    <aside className="relative isolate order-2 flex flex-col justify-center gap-10 overflow-hidden bg-brand-veil px-8 py-14 lg:order-1 lg:px-14 lg:py-20">
      <div aria-hidden className="--dot-grid absolute inset-0 opacity-40" />

      <div className="relative space-y-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-deep">
          TrackXpense
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
          Know where the money went, without connecting a single bank
        </h1>
        <p className="max-w-md text-muted-foreground">
          A two-account ledger you fill in yourself. No bank to connect, no statement to import —
          open an account, log the entry, and the balance and budget headroom on your dashboard move
          the moment you save.
        </p>
      </div>

      <ul className="relative space-y-6">
        {PROPS.map((prop) => (
          <li key={prop.title} className="flex gap-4">
            <prop.icon className="mt-0.5 size-6 shrink-0 text-brand-deep" />
            <div className="space-y-1">
              <h2 className="font-semibold text-foreground">{prop.title}</h2>
              <p className="text-sm text-muted-foreground">{prop.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
