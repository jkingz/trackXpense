"use client";

import { useRouter } from "next/navigation";
import { useContext, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createTransaction } from "@/actions/transaction";
import { CurrencyContext } from "@/app/(main)/_components/currency-context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defaultCategories } from "@/data/categories";
import useFetch from "@/hooks/use-fetch";
import { currencySymbol } from "@/lib/money";
import { cn } from "@/lib/utils";

type Kind = "EXPENSE" | "INCOME";

// The bar stays white in both themes, so its controls pin their own ink.
const chip =
  "h-10 rounded-lg border-navy/15 bg-white px-3 text-sm text-navy dark:bg-white dark:hover:bg-white";

/** One-line entry on the balance hero: dated today, lands as the highlighted row. */
export function QuickEntry({
  accounts,
}: {
  accounts: { id: string; name: string; isDefault: boolean }[];
}) {
  const router = useRouter();
  const currency = useContext(CurrencyContext);
  const [type, setType] = useState<Kind>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("food");
  const [accountId, setAccountId] = useState(
    (accounts.find((account) => account.isDefault) ?? accounts[0])?.id ?? "",
  );
  const { loading, fn } = useFetch(createTransaction);

  const categories = defaultCategories.filter((item) => item.type === type);

  const switchType = (next: Kind) => {
    setType(next);
    setCategory(next === "EXPENSE" ? "food" : "salary");
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter an amount above zero");
      return;
    }
    const result = await fn({
      type,
      amount: value,
      description: description.trim(),
      accountId,
      category,
      date: new Date(),
      isRecurring: false,
    });
    if (!result?.success) return;
    setAmount("");
    setDescription("");
    router.replace(`/dashboard?saved=${result.data.id}`, { scroll: false });
  };

  return (
    <form
      onSubmit={onSubmit}
      aria-label="Quick entry"
      className="offset-shadow flex flex-wrap items-center gap-2 rounded-xl bg-white p-2 text-navy"
    >
      <div role="group" aria-label="Entry type" className="flex rounded-lg bg-indigo-soft/25 p-1">
        {(["EXPENSE", "INCOME"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={type === kind}
            onClick={() => switchType(kind)}
            className={cn(
              "h-9 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-indigo",
              type === kind ? "bg-navy text-white" : "text-navy/70 hover:text-navy",
            )}
          >
            {kind === "EXPENSE" ? "Expense" : "Income"}
          </button>
        ))}
      </div>

      <label className="flex h-10 min-w-24 flex-1 items-center gap-1 rounded-md px-2 font-mono text-lg sm:w-24 sm:flex-none focus-within:outline-2 focus-within:outline-indigo">
        <span aria-hidden>{currencySymbol[currency]}</span>
        <span className="sr-only">Amount</span>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0"
          className="w-full bg-transparent outline-none placeholder:text-navy/40"
        />
      </label>

      <label className="basis-full sm:min-w-28 sm:flex-1 sm:basis-auto">
        <span className="sr-only">What for</span>
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What for?"
          className="h-10 w-full rounded-md bg-transparent px-2 text-base outline-none placeholder:text-navy/40 focus-visible:ring-2 focus-visible:ring-indigo"
        />
      </label>

      <Select
        value={category}
        items={categories.map((item) => ({ label: item.name, value: item.id }))}
        onValueChange={(value) => value && setCategory(value)}
      >
        <SelectTrigger aria-label="Category" className={chip}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categories.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={accountId}
        items={accounts.map((account) => ({ label: account.name, value: account.id }))}
        onValueChange={(value) => value && setAccountId(value)}
      >
        <SelectTrigger aria-label="Account" className={chip}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="submit"
        loading={loading}
        className="h-10 flex-1 rounded-lg bg-indigo px-5 sm:flex-none font-semibold text-white hover:bg-indigo/90"
      >
        Log it
      </Button>
    </form>
  );
}
