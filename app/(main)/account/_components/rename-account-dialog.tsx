"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { renameAccount } from "@/actions/accounts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useFetch from "@/hooks/use-fetch";

/**
 * Renames one account from its ledger page. Only the label changes; the balance,
 * entries and default flag are untouched. Reopening discards a half-typed name.
 */
export function RenameAccountDialog({ accountId, name }: { accountId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(name);
  const router = useRouter();
  const { data, loading, setData, fn } = useFetch(renameAccount);

  // Reset on open only: keying this to a render-time effect would wipe the
  // field on every keystroke because setData is a fresh closure each render.
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;
    setValue(name);
    setData(undefined);
  };

  useEffect(() => {
    if (!data) return;
    if (data.success && data.data) {
      toast.success(`Renamed to ${data.data.name}`);
      setOpen(false);
      router.refresh();
      return;
    }
    toast.error("error" in data ? data.error : "Could not rename the account");
  }, [data, router]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = value.trim();
    if (!nextName) return;
    if (nextName === name) {
      setOpen(false);
      return;
    }
    await fn(accountId, nextName);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            aria-label={`Rename ${name}`}
          />
        }
      >
        <Pencil className="size-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={onSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Rename account</DialogTitle>
            <DialogDescription>
              The balance, entries and default flag stay with this account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <label htmlFor="account-name" className="text-sm font-medium">
              Account name
            </label>
            <Input
              id="account-name"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              maxLength={100}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={!value.trim()}>
              Save name
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
