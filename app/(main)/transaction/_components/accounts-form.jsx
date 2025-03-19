import CreateAccountDrawer from '@/components/create-account-drawer';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AccountsForm = ({ accounts, setValue, getValues, errors }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Account</label>
      <Select
        onValueChange={(value) => setValue('accountId', value)}
        defaultValue={getValues('accountId')}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select account" />
        </SelectTrigger>
        <SelectContent className="w-full">
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.name} (${account.balance.toFixed(2)})
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
      {errors.account && (
        <p className="text-sm text-red-500">{errors.account.message}</p>
      )}
    </div>
  );
};

export default AccountsForm;
