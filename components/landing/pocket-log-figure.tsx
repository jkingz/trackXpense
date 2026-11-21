"use client";

import { ArrowDownLeft, Check, ReceiptText } from "lucide-react";
import dynamic from "next/dynamic";

import { useLandingPreview } from "@/components/landing/landing-motion";
import { PreviewAmount } from "@/components/landing/preview-amount";
import { formatMoney } from "@/lib/money";

const ReceiptScene = dynamic(() => import("./receipt-scene"), { ssr: false });

export function PocketLogFigure() {
  const { sample, playing } = useLandingPreview();
  const balances = [
    { label: "Total balance", amount: sample.balance },
    { label: "Budget left", amount: sample.budgetLeft },
  ];

  return (
    <figure className="min-w-0">
      <div
        aria-hidden
        className="landing-stage relative isolate flex min-h-101 flex-col justify-center overflow-hidden rounded-tl-4xl rounded-br-[5rem] bg-landing-cobalt px-5 py-12 sm:min-h-132 sm:px-12"
      >
        {playing && <ReceiptScene sampleDay={sample.day} playing={playing} />}
        <div
          data-landing-statement
          className="relative w-full max-w-102 rounded-3xl border border-landing-rule bg-landing-sheet p-5 text-landing-ink shadow-2xl sm:p-7"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">Everyday ledger</p>
            <span className="rounded-full bg-landing-cream px-2.5 py-1 font-mono text-xs">PHP</span>
          </div>
          <dl className="mt-5 space-y-4">
            {balances.map(({ label, amount }, index) => (
              <div
                key={label}
                className={
                  index === 0
                    ? "border-b border-landing-rule pb-4"
                    : "flex items-baseline justify-between gap-3"
                }
              >
                <dt className="text-sm text-landing-muted">{label}</dt>
                <dd
                  className={
                    index === 0
                      ? "mt-1 text-4xl font-extrabold tracking-tighter tabular-nums sm:text-6xl"
                      : "font-semibold tabular-nums"
                  }
                >
                  <span className={index === 0 ? "mr-1 text-[0.65em] font-medium" : undefined}>
                    ₱
                  </span>
                  <PreviewAmount amount={amount} withoutSymbol />
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex items-center gap-2 border-t border-landing-rule pt-4 text-sm text-landing-muted">
            <ArrowDownLeft className="size-4 text-landing-cobalt" /> Balances update when you save
          </div>
        </div>

        <div
          data-landing-expense
          className="relative z-10 -mt-1 ml-auto flex w-fit max-w-full items-center gap-3 rounded-2xl border border-landing-ink/15 bg-landing-sage px-3 py-3 text-landing-ink shadow-xl sm:-mt-4 sm:gap-4 sm:px-4"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-landing-ink text-landing-sage">
            <ReceiptText className="size-4" />
          </span>
          <span>
            <strong className="block text-sm">{sample.description}</strong>
            <span className="flex items-center gap-1 text-xs">
              <Check className="size-3" /> Expense saved
            </span>
          </span>
          <strong className="shrink-0 font-mono text-sm">
            −{formatMoney(sample.amount, "PHP")}
          </strong>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-muted-foreground">
        <span>
          Sample ledger after a {formatMoney(sample.amount, "PHP")} expense.
          <span className="sr-only">
            {" "}
            New balance {formatMoney(sample.balance, "PHP")}. Budget left{" "}
            {formatMoney(sample.budgetLeft, "PHP")}.
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
