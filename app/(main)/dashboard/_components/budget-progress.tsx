"use client";
import { Check, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { updateBudget } from "@/actions/budget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import useFetch from "@/hooks/use-fetch";
import { usd } from "@/lib/money";
import { cn } from "@/lib/utils";

const BudgetProgress = ({
  initialBudget,
  currentExpenses,
}: {
  initialBudget: { amount: number } | null | undefined;
  currentExpenses: number;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(initialBudget?.amount?.toString() || "");

  const {
    loading: isLoading,
    fn: updateBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch(updateBudget);

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

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update budget");
    }
  }, [error]);

  return (
    <section
      aria-labelledby="budget-heading"
      className="glass-panel flex h-full flex-col px-4 py-3"
    >
      <header className="flex items-center justify-between gap-4">
        <h2
          id="budget-heading"
          className="text-sm font-semibold tracking-tight text-card-foreground"
        >
          Monthly budget
        </h2>
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            aria-label="Set monthly budget"
          >
            <Pencil className="size-3.5" />
          </Button>
        )}
      </header>

      {isEditing ? (
        <div className="mt-4 flex items-center gap-2">
          <Input
            type="number"
            value={newBudget}
            onChange={(e) => setNewBudget(e.target.value)}
            className="w-full"
            placeholder="New budget"
            autoFocus
            disabled={isLoading}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleUpdateBudget}
            loading={isLoading}
            aria-label="Save budget"
          >
            <Check className="size-4 text-income" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            disabled={isLoading}
            aria-label="Cancel"
          >
            <X className="size-4 text-muted-foreground" />
          </Button>
        </div>
      ) : (
        <>
          <p className="mt-3 font-mono text-xl font-semibold tabular-nums leading-none tracking-tight text-foreground">
            ${usd(currentExpenses)}
            {initialBudget && (
              <span className="text-base font-medium text-muted-foreground">
                {" "}
                / ${usd(initialBudget.amount)}
              </span>
            )}
          </p>

          {initialBudget ? (
            <div className="mt-4 space-y-2">
              <Progress
                value={percentUsed}
                extraStyles={
                  percentUsed >= 90 ? "bg-expense" : percentUsed >= 75 ? "bg-warn" : "bg-income"
                }
              />
              <p className="text-xs text-muted-foreground">
                {headroom >= 0 ? `$${usd(headroom)} left` : `$${usd(Math.abs(headroom))} over`}
                <span aria-hidden> · </span>
                <span className={cn("font-mono tabular-nums", percentUsed >= 90 && "text-expense")}>
                  {percentUsed.toFixed(1)}% used
                </span>
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No budget yet. Set one and this rail tracks the default account against it.
            </p>
          )}
        </>
      )}
    </section>
  );
};

export default BudgetProgress;
