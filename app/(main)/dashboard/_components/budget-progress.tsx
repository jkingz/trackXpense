"use client";
import { Check, X } from "lucide-react";
import { useContext, useEffect, useId, useState } from "react";
import { toast } from "sonner";

import { updateBudget } from "@/actions/budget";
import { CurrencyContext } from "@/app/(main)/_components/currency-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useFetch from "@/hooks/use-fetch";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Navy budget card: headroom first, then the share used and the days still to run. */
const BudgetProgress = ({
  initialBudget,
  currentExpenses,
  monthName,
  daysLeft,
}: {
  initialBudget: { amount: number } | null | undefined;
  currentExpenses: number;
  monthName: string;
  daysLeft: number;
}) => {
  const currency = useContext(CurrencyContext);
  const headingId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(initialBudget?.amount?.toString() || "");

  const { loading: isLoading, fn: updateBudgetFn, data: updatedBudget } = useFetch(updateBudget);

  const percentUsed = initialBudget ? (currentExpenses / initialBudget.amount) * 100 : 0;
  const headroom = (initialBudget?.amount ?? 0) - currentExpenses;

  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    await updateBudgetFn(amount);
  };

  const handleCancel = () => {
    setNewBudget(initialBudget?.amount?.toString() || "");
    setIsEditing(false);
  };

  useEffect(() => {
    if (updatedBudget?.success) {
      setIsEditing(false);
      toast.success("Budget updated successfully");
    }
  }, [updatedBudget]);

  // Error toast lives in useFetch (single source).

  return (
    <section
      aria-labelledby={headingId}
      className="flex h-full flex-col rounded-3xl bg-navy p-6 text-white dark:border dark:border-white/10"
    >
      <header className="flex items-center justify-between gap-4">
        <h2 id={headingId} className="font-semibold tracking-tight">
          {monthName} budget
        </h2>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-sm text-sm text-indigo-soft hover:text-white focus-visible:outline-2 focus-visible:outline-indigo-soft"
          >
            Edit
          </button>
        )}
      </header>

      {isEditing ? (
        <div className="mt-4 flex items-center gap-2">
          <Input
            type="number"
            value={newBudget}
            onChange={(e) => setNewBudget(e.target.value)}
            className="w-full border-white/20 bg-white/10 text-white"
            placeholder="New budget"
            aria-label="Monthly budget"
            autoFocus
            disabled={isLoading}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleUpdateBudget}
            loading={isLoading}
            aria-label="Save budget"
            className="hover:bg-white/10"
          >
            <Check className="size-4 text-lime" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            disabled={isLoading}
            aria-label="Cancel"
            className="hover:bg-white/10"
          >
            <X className="size-4 text-white/70" />
          </Button>
        </div>
      ) : initialBudget ? (
        <>
          <p className="mt-4 flex flex-wrap items-baseline gap-x-4">
            <span className={cn("font-mono text-3xl tabular-nums", headroom < 0 && "text-expense")}>
              {formatMoney(Math.abs(headroom), currency)}
            </span>
            <span className="text-sm text-white/75">
              {headroom >= 0 ? "left" : "over"} of {formatMoney(initialBudget.amount, currency)}
            </span>
          </p>
          <div
            role="progressbar"
            aria-label="Budget used"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(Math.min(100, percentUsed))}
            className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10"
          >
            <div
              className={cn(
                "--share-bar h-full rounded-full",
                percentUsed >= 100 ? "bg-expense" : "bg-lime",
              )}
              style={{ width: `${Math.min(100, percentUsed)}%` }}
            />
          </div>
          <p className="mt-4 text-xs text-white/75">
            {daysLeft === 0 ? "Ends today" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`}
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm text-white/75">
          No budget yet. Set one and this card tracks the default account against it.
        </p>
      )}
    </section>
  );
};

export default BudgetProgress;
