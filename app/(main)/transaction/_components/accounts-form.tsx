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
import type { FieldErrors, UseFormGetValues, UseFormSetValue } from "react-hook-form";

import type { SerializedAccount, TransactionFormValues } from "./add-transaction-form";

const AccountsForm = ({
  accounts,
  setValue,
  getValues,
  errors,
}: {
  accounts: SerializedAccount[];
  setValue: UseFormSetValue<TransactionFormValues>;
  getValues: UseFormGetValues<TransactionFormValues>;
  errors: FieldErrors<TransactionFormValues>;
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Account</label>
      {/* `items` lets the closed trigger show the account name: the SelectItem labels
          are not mounted until the popup opens, so without it the trigger renders the id. */}
      <Select
        items={accounts.map((account) => ({ label: account.name, value: account.id }))}
        onValueChange={(value) => setValue("accountId", value ?? "")}
        defaultValue={getValues("accountId")}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select account" />
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
