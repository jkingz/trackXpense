import CreateAccountDrawer from "@/components/create-account-drawer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signedUsd } from "@/lib/money";
import type { FieldErrors, UseFormSetValue } from "react-hook-form";

import type { SerializedAccount, TransactionFormValues } from "./add-transaction-form";

const AccountsForm = ({
  accounts,
  setValue,
  accountId,
  errors,
}: {
  accounts: SerializedAccount[];
  setValue: UseFormSetValue<TransactionFormValues>;
  accountId?: string;
  errors: FieldErrors<TransactionFormValues>;
}) => {
  const selected = accounts.find((account) => account.id === accountId);

  return (
    <div className="space-y-2">
      <span id="account-label" className="text-sm text-muted-foreground">
        Account
      </span>
      {/* `items` lets the closed trigger show the account name: the SelectItem labels
          are not mounted until the popup opens, so without it the trigger renders the id. */}
      <Select
        value={accountId ?? null}
        items={accounts.map((account) => ({ label: account.name, value: account.id }))}
        onValueChange={(value) => setValue("accountId", value ?? "")}
      >
        <SelectTrigger
          aria-labelledby="account-label"
          className="h-12 w-full rounded-xl bg-card px-4 text-base"
        >
          <SelectValue placeholder="Select account" />
          {selected && (
            <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
              {signedUsd(selected.balance)}
            </span>
          )}
        </SelectTrigger>
        <SelectContent className="w-full">
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.name} ({signedUsd(account.balance)})
            </SelectItem>
          ))}
          <CreateAccountDrawer>
            <Button
              className="w-full select-none items-center text-sm outline-none"
              variant="ghost"
            >
              Create Account
            </Button>
          </CreateAccountDrawer>
        </SelectContent>
      </Select>
      {errors.accountId && <p className="text-sm text-destructive">{errors.accountId.message}</p>}
    </div>
  );
};

export default AccountsForm;
