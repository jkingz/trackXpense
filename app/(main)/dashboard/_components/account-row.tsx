"use client";

import { useEffect, type MouseEvent } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { updateDefaultAccount } from "@/actions/accounts";
import PendingRail from "@/components/pending-rail";
import { Switch } from "@/components/ui/switch";
import useFetch from "@/hooks/use-fetch";
import { signedUsd } from "@/lib/money";

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  isDefault: boolean;
  _count?: { transactions?: number } | null;
};

/**
 * One ledger row. The name and the balance are the link, and the default switch
 * sits outside it, so the switch is a real control rather than a click trapped
 * inside an anchor. The `click to view` hint sits right of the balance — the
 * row's clickability indicator, aligned with the figure it acts on.
 */
export function AccountRow({ account }: { account: Account }) {
  const { id, name, type, balance, isDefault, _count } = account;
  const {
    data: updated,
    error,
    fn: updateAccountFn,
    loading: updateAccountLoading,
  } = useFetch(updateDefaultAccount);

  const handleDefaultAccountChange = async (event: MouseEvent) => {
    event.preventDefault();
    if (isDefault) {
      toast.warning("At least one account has to be the default");
      return;
    }
    await updateAccountFn(id);
  };

  useEffect(() => {
    if (updated && !updateAccountLoading) {
      toast.success(`${name} is now the default account`);
    }
  }, [updated, updateAccountLoading, name]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Could not set the default account");
    }
  }, [error]);

  const transactions = _count?.transactions ?? 0;

  return (
    <li className="relative">
      <div className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-accent/40">
        <Link
          href={`/account/${id}`}
          className="block min-w-0 flex-1 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-card-foreground">
            <span className="truncate">{name}</span>
            {transactions > 0 && (
              <span className="shrink-0 text-xs font-normal text-muted-foreground">
                {transactions} {transactions === 1 ? "entry" : "entries"}
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {type.charAt(0) + type.slice(1).toLowerCase()} account
          </span>
          <span className="mt-1 flex items-center justify-between gap-3 pr-1">
            <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {signedUsd(balance)}
            </span>
            <span className="flex shrink-0 translate-y-[1px] items-center gap-1 text-xs text-muted-foreground">
              click to view
              <ChevronRight className="size-3" aria-hidden />
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          {isDefault && (
            <span className="hidden text-xs text-muted-foreground sm:inline">Default</span>
          )}
          <Switch
            checked={isDefault}
            onClick={handleDefaultAccountChange}
            disabled={updateAccountLoading}
            aria-label={`Make ${name} the default account`}
          />
        </div>
      </div>

      {updateAccountLoading && (
        <PendingRail label={`Setting ${name} as default`} className="absolute inset-x-0 bottom-0" />
      )}
    </li>
  );
}
