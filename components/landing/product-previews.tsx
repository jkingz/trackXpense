"use client";

import { Camera, Check } from "lucide-react";
import { motion } from "motion/react";

import { useLandingPreview } from "@/components/landing/landing-motion";
import { PreviewAmount } from "@/components/landing/preview-amount";
import { cn } from "@/lib/utils";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const chartMaximum = 1_000;
const settle = [0.22, 1, 0.36, 1] as const;

export function ReceiptPreview() {
  const { sample, playing } = useLandingPreview();

  return (
    <figure
      data-receipt-preview
      className="relative isolate mx-auto w-full max-w-lg overflow-hidden rounded-3xl border border-landing-rule bg-landing-cream p-5 text-landing-ink sm:p-8"
    >
      <motion.div
        key={sample.description}
        aria-hidden
        data-receipt-scan
        initial={playing ? { y: "-100%", opacity: 0 } : false}
        animate={
          playing ? { y: ["-100%", "370%"], opacity: [0, 0.85, 0.85, 0] } : { y: 0, opacity: 0 }
        }
        transition={playing ? { duration: 0.85, ease: "easeInOut" } : { duration: 0 }}
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-1/3 border-b border-landing-cobalt/40 bg-linear-to-b from-transparent to-landing-cobalt/12"
      />
      <div className="flex items-center justify-between gap-4 border-b border-landing-rule pb-4">
        <div className="flex items-center gap-2 font-semibold">
          <Camera aria-hidden className="size-5 text-landing-cobalt" /> Receipt preview
        </div>
        <Check aria-hidden className="size-5 text-landing-cobalt" />
      </div>
      <dl className="divide-y divide-landing-rule">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4">
          <dt className="text-landing-muted">Amount</dt>
          <dd data-receipt-amount className="text-3xl font-extrabold tracking-tight tabular-nums">
            <PreviewAmount amount={sample.amount} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-3">
          <dt className="text-landing-muted">Description</dt>
          <dd className="font-semibold">
            <motion.span
              key={sample.description}
              initial={playing ? { y: 7 } : false}
              animate={{ y: 0 }}
              transition={{ duration: playing ? 0.35 : 0, ease: settle }}
              className="block"
            >
              {sample.description}
            </motion.span>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 pt-3">
          <dt className="text-landing-muted">Category</dt>
          <dd>
            <motion.span
              key={sample.category}
              initial={playing ? { y: 6 } : false}
              animate={{ y: 0 }}
              transition={{ duration: playing ? 0.38 : 0, ease: settle }}
              className="block rounded-full bg-landing-sage px-3 py-1 text-sm font-semibold"
            >
              {sample.category}
            </motion.span>
          </dd>
        </div>
      </dl>
    </figure>
  );
}

export function SpendingPreview() {
  const { sample, playing } = useLandingPreview();

  return (
    <figure className="min-w-0 rounded-3xl border border-white/15 bg-landing-night-sheet p-5 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">This week’s spending</p>
        <p data-week-total className="font-mono text-sm text-landing-sage tabular-nums">
          <PreviewAmount amount={sample.weekTotal} />
        </p>
      </div>
      <div
        aria-hidden
        data-spending-chart
        className="mt-6 grid h-32 grid-cols-7 items-end gap-2 border-b border-white/15 sm:gap-3"
      >
        {days.map((day, index) => (
          <motion.div
            key={day}
            data-spending-bar={day}
            initial={false}
            animate={{ scaleY: sample.spending[index] / chartMaximum }}
            transition={{ duration: playing ? 0.62 : 0, ease: settle }}
            className={cn(
              "h-full origin-bottom rounded-t-sm bg-landing-light-blue motion-safe:transition-colors",
              index === sample.day && "bg-landing-sage",
            )}
          />
        ))}
      </div>
      <div
        aria-hidden
        className="mt-3 grid grid-cols-7 gap-2 text-center text-xs text-landing-night-muted sm:gap-3"
      >
        {days.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <figcaption className="sr-only">
        Sample spending by day. The highlighted bar includes the {sample.category.toLowerCase()}{" "}
        expense.
      </figcaption>
    </figure>
  );
}
