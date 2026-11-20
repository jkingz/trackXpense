"use client";

import { CurrencyContext } from "@/app/(main)/_components/currency-context";
import { useContext, useEffect, type MouseEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { updateDefaultAccount } from "@/actions/accounts";
import PendingRail from "@/components/pending-rail";
import { Switch } from "@/components/ui/switch";
import useFetch from "@/hooks/use-fetch";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  isDefault: boolean;
  _count?: { transactions?: number } | null;
};

/**
 * The account name and balance are one link, with a separate default switch.
 */
export function AccountRow({ account, active = false }: { account: Account; active?: boolean }) {
  const currency = useContext(CurrencyContext);
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
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-2.5 transition-colors hover:bg-sidebar-accent",
          active && "bg-sidebar-accent",
        )}
      >
        <Link
          href={`/account/${id}`}
          aria-current={active ? "page" : undefined}
          className="block min-w-0 flex-1 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="flex min-w-0 items-center text-sm font-medium text-card-foreground">
            <span className="truncate">{name}</span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {type.charAt(0) + type.slice(1).toLowerCase()} account
            {transactions > 0 && ` · ${transactions} ${transactions === 1 ? "entry" : "entries"}`}
          </span>
          <span className="mt-1 block font-mono text-sm font-semibold tabular-nums break-words text-foreground">
            {formatMoney(balance, currency)}
          </span>
        </Link>

        <div className="flex shrink-0 flex-col items-center gap-1">
          <Switch
            checked={isDefault}
            onClick={handleDefaultAccountChange}
            disabled={updateAccountLoading}
            aria-label={`Make ${name} the default account`}
          />
          {isDefault && <span className="text-xs text-muted-foreground">Default</span>}
        </div>
      </div>

      {updateAccountLoading && (
        <PendingRail label={`Setting ${name} as default`} className="absolute inset-x-0 bottom-0" />
      )}
    </li>
  );
}
