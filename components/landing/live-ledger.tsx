"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Entry = {
  id: number;
  description: string;
  category: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  time: string;
};

/**
 * The product's promise, demonstrated instead of claimed: an entry lands and the
 * balance moves. Amounts are illustrative; the fields are the real ones from the
 * add-transaction form (description, amount, type, category, date).
 */
const QUEUE: Omit<Entry, "id">[] = [
  {
    description: "Weekly shop",
    category: "Groceries",
    amount: 62.4,
    type: "EXPENSE",
    time: "08:12",
  },
  { description: "Salary", category: "Salary", amount: 2400, type: "INCOME", time: "09:00" },
  {
    description: "Metro card top-up",
    category: "Transportation",
    amount: 30,
    type: "EXPENSE",
    time: "09:41",
  },
  {
    description: "Electricity bill",
    category: "Utilities",
    amount: 88.15,
    type: "EXPENSE",
    time: "11:05",
  },
  { description: "Design gig", category: "Freelance", amount: 480, type: "INCOME", time: "13:20" },
  {
    description: "Pharmacy",
    category: "Healthcare",
    amount: 21.99,
    type: "EXPENSE",
    time: "15:02",
  },
  { description: "Dinner out", category: "Food", amount: 45.5, type: "EXPENSE", time: "19:37" },
  { description: "Rent", category: "Housing", amount: 1150, type: "EXPENSE", time: "20:00" },
];

const STARTING_BALANCE = 1204.6;
const BUDGET = 2600;
const VISIBLE_ROWS = 5;
const TICK_MS = 2100;

const money = (value: number) =>
  value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const signed = (entry: Pick<Entry, "amount" | "type">) =>
  entry.type === "INCOME" ? entry.amount : -entry.amount;

const spentOf = (entries: Pick<Entry, "amount" | "type">[]) =>
  entries.reduce((total, entry) => total + (entry.type === "EXPENSE" ? entry.amount : 0), 0);

/** What the list shows before any motion runs, oldest first. */
const INITIAL_ROWS: Entry[] = QUEUE.slice(0, VISIBLE_ROWS).map((row, index) => ({
  ...row,
  id: index,
}));

function LedgerRow({ entry }: { entry: Entry }) {
  const isIncome = entry.type === "INCOME";

  return (
    <motion.li
      layout
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -16, opacity: 0, transition: { duration: 0.22 } }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-between gap-3 border-b border-dashed py-2.5 last:border-b-0"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-card-foreground">{entry.description}</p>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">{entry.time}</span>
          <span aria-hidden>&middot;</span>
          <span className="truncate">{entry.category}</span>
        </p>
      </div>
      <p
        className={cn(
          "shrink-0 font-mono text-sm font-medium tabular-nums",
          isIncome ? "text-income" : "text-expense",
        )}
      >
        {isIncome ? "+" : "\u2212"}
        {money(entry.amount)}
      </p>
    </motion.li>
  );
}

export function LiveLedger() {
  const [rows, setRows] = useState<Entry[]>(INITIAL_ROWS);
  const [spent, setSpent] = useState(() => spentOf(INITIAL_ROWS));

  // The balance is written straight to the node instead of through state, so a
  // spring at sixty frames a second never re-renders the list beside it.
  const balance = useMotionValue(
    STARTING_BALANCE + INITIAL_ROWS.reduce((total, entry) => total + signed(entry), 0),
  );
  const spring = useSpring(balance, { stiffness: 90, damping: 20, mass: 0.6 });
  const balanceRef = useRef<HTMLSpanElement>(null);
  // Seeded past the ids INITIAL_ROWS already owns (0 through VISIBLE_ROWS - 1).
  const cursor = useRef(VISIBLE_ROWS);

  useMotionValueEvent(spring, "change", (value) => {
    if (balanceRef.current) balanceRef.current.textContent = money(value);
  });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      // Ref, not a closure variable: a second effect setup must not restart the
      // count, or it reissues ids that are still mounted as exiting rows.
      const id = cursor.current;
      cursor.current += 1;
      const next: Entry = { ...QUEUE[id % QUEUE.length], id };

      setRows((current) => [...current.slice(-(VISIBLE_ROWS - 1)), next]);
      balance.jump(balance.get() + signed(next));
      if (next.type === "EXPENSE") setSpent((current) => current + next.amount);
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [balance]);

  const percentUsed = Math.min((spent / BUDGET) * 100, 100);

  return (
    <div className="glass-panel p-5 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold tracking-tight text-card-foreground">
          Add a transaction
        </p>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="--live-dot size-1.5 rounded-full bg-income" aria-hidden />
          <span className="font-mono uppercase tracking-[0.16em]">live</span>
        </span>
      </div>

      {/* Fixed height: the stream replaces rows inside this window, so nothing
          below it shifts as the ledger fills. */}
      <ul className="mt-2 h-[236px] overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          {rows.map((entry) => (
            <LedgerRow key={entry.id} entry={entry} />
          ))}
        </AnimatePresence>
      </ul>

      <div className="mt-3 rounded-xl bg-brand-veil p-4">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-sm text-muted-foreground">Current balance</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Current
          </p>
        </div>
        <p className="mt-1 font-mono text-3xl font-bold tabular-nums tracking-tight text-brand-deep">
          <span ref={balanceRef}>{money(balance.get())}</span>
        </p>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-4 text-xs">
          <p className="text-muted-foreground">Budget headroom</p>
          <p className="font-mono tabular-nums text-muted-foreground">
            {percentUsed.toFixed(1)}% used
          </p>
        </div>
        <Progress
          value={percentUsed}
          className="mt-2"
          extraStyles={percentUsed >= 90 ? "bg-expense" : "bg-brand-deep"}
        />
      </div>
    </div>
  );
}
