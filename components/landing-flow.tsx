import { Banknote, Coffee, PiggyBank, ShoppingBasket, TrainFront } from "lucide-react";

import { ReceiptPreview, SpendingPreview } from "@/components/landing/product-previews";

const accounts = [
  { name: "Everyday", type: "Checking", amount: "₱12,200.00", icon: Banknote },
  { name: "Rainy day", type: "Savings", amount: "₱6,250.00", icon: PiggyBank },
];

export default function LandingFlow() {
  return (
    <>
      <section id="flow" aria-labelledby="flow-title" className="border-y bg-card">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 sm:px-10 lg:grid-cols-2 lg:gap-20 lg:px-16 lg:py-24">
          <div>
            <h2
              id="flow-title"
              className="max-w-lg text-4xl leading-none font-extrabold tracking-tighter sm:text-6xl"
            >
              From receipt to record.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
              Type the amount or scan a receipt to fill in the details. Pick a category and an
              account, then save. Your balance updates right away.
            </p>
          </div>
          <ReceiptPreview />
        </div>
      </section>

      <section id="inside" aria-labelledby="budget-title" className="bg-landing-ink text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-16 lg:py-24">
          <div className="lg:order-2">
            <h2
              id="budget-title"
              className="max-w-lg text-4xl leading-none font-extrabold tracking-tighter sm:text-6xl"
            >
              See what’s left before you spend.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-landing-night-muted">
              Set a monthly budget for your default account. Check what’s left as you log purchases,
              and review spending by day or month.
            </p>
          </div>
          <SpendingPreview />
        </div>
      </section>

      <section id="categories" aria-labelledby="accounts-title" className="border-b">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 sm:px-10 lg:grid-cols-2 lg:gap-20 lg:px-16 lg:py-24">
          <div>
            <h2
              id="accounts-title"
              className="max-w-lg text-4xl leading-none font-extrabold tracking-tighter sm:text-6xl"
            >
              Keep spending and savings separate.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
              Give checking and savings their own ledgers. Categorize what you spend and choose
              pesos or US dollars for your ledger. No bank connection required.
            </p>
          </div>
          <div className="w-full rounded-3xl border bg-card p-5 sm:p-8">
            <dl data-accounts-preview className="divide-y">
              {accounts.map(({ name, type, amount, icon: Icon }) => (
                <div
                  key={name}
                  data-account-row
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0"
                >
                  <dt className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-landing-sage text-landing-ink">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <span>
                      <strong className="block">{name}</strong>
                      <span className="text-sm text-muted-foreground">{type}</span>
                    </span>
                  </dt>
                  <dd className="font-mono text-sm font-semibold tabular-nums">{amount}</dd>
                </div>
              ))}
            </dl>
            <ul
              aria-label="Example categories"
              className="mt-3 flex flex-wrap gap-2 border-t pt-4 text-sm"
            >
              {[
                { name: "Food", icon: Coffee },
                { name: "Groceries", icon: ShoppingBasket },
                { name: "Transport", icon: TrainFront },
              ].map(({ name, icon: Icon }) => (
                <li
                  key={name}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-muted-foreground"
                >
                  <Icon aria-hidden className="size-3.5" /> {name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
