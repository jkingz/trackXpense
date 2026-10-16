"use client";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MoreHorizontal,
  RefreshCcw,
  Search,
  Trash,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useReducer, useTransition } from "react";
import { toast } from "sonner";

import { bulkDeleteTransactions } from "@/actions/accounts";
import PaginationControls from "@/components/pagination";
import PendingRail from "@/components/pending-rail";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import Shadcn AlertDialog components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { categoryColors } from "@/data/categories";
import useFetch from "@/hooks/use-fetch";
import { usd } from "@/lib/money";
import {
  initialTransactionTableState,
  transactionTableReducer,
} from "@/lib/transaction-table-state";
import { cn } from "@/lib/utils";

const RECURRING_INTERVALS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};
const ITEMS_PER_PAGE = 10;

type TableTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string | null;
  date: Date;
  category: string;
  isRecurring: boolean;
  recurringInterval: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | null;
  nextRecurringDate: Date | null;
};

const TransactionsTable = ({
  transactions,
  totalItems,
  searchParams,
}: {
  transactions: TableTransaction[];
  totalItems: number;
  searchParams: Record<string, string | undefined>;
}) => {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [state, dispatch] = useReducer(
    transactionTableReducer,
    initialTransactionTableState(searchParams),
  );
  const { selectedIds, searchTerm, typeFilter, recurringFilter, deleteDialogOpen } = state;

  const currentPage = parseInt(urlSearchParams.get("page") || "1", 10);
  const sortField = urlSearchParams.get("sortField") || "date";
  const sortDirection = urlSearchParams.get("sortDirection") || "desc";
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const { loading: deleteLoading, fn: deleteFn, data: deleted } = useFetch(bulkDeleteTransactions);
  const preserveScroll = (callback: () => void) => {
    const scrollPosition = window.scrollY;
    callback();
    window.scrollTo(0, scrollPosition);
  };

  const handleSort = (field: string) => {
    const newDirection = field === sortField && sortDirection === "asc" ? "desc" : "asc";
    const params = new URLSearchParams(urlSearchParams.toString());
    params.set("sortField", field);
    params.set("sortDirection", newDirection);
    startTransition(() => preserveScroll(() => router.push(`?${params.toString()}`)));
  };

  const handleSelect = (id: string) => {
    dispatch({ type: "TOGGLE_SELECT", id });
  };

  const handleSelectAll = (checked: boolean) => {
    dispatch({
      type: "SET_SELECT_ALL",
      checked,
      visibleIds: transactions.map((t) => t.id),
    });
  };

  const allSelected = transactions.length > 0 && selectedIds.length === transactions.length;

  const handleBulkDelete = async () => {
    dispatch({ type: "SET_DELETE_DIALOG", open: true });
  };

  const confirmBulkDelete = async () => {
    const response = await deleteFn(selectedIds);
    if (response?.success) {
      dispatch({ type: "CLEAR_SELECTION" });
      router.refresh();
    }
    dispatch({ type: "SET_DELETE_DIALOG", open: false });
  };

  useEffect(() => {
    if (deleted && !deleteLoading) {
      toast.success("Transactions deleted");
    }
  }, [deleted, deleteLoading]);

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(urlSearchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => preserveScroll(() => router.push(`?${params.toString()}`)));
  };

  const handleClearFilters = () => {
    dispatch({ type: "CLEAR_FILTERS" });
    startTransition(() => router.push("?page=1"));
  };

  return (
    <div className="space-y-4">
      {(deleteLoading || isPending) && (
        <PendingRail label="Updating transactions" className="mt-4" />
      )}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => {
              dispatch({ type: "SET_SEARCH", value: e.target.value });
              updateSearchParams("search", e.target.value);
            }}
            className="pl-8 shadow-none focus:ring-1 focus:ring-ring border border-input"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              const next = value ?? "";
              dispatch({ type: "SET_TYPE_FILTER", value: next });
              updateSearchParams("type", next);
            }}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={recurringFilter}
            onValueChange={(value) => {
              const next = value ?? "";
              dispatch({ type: "SET_RECURRING_FILTER", value: next });
              updateSearchParams("recurring", next);
            }}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="All Transactions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recurring">Recurring Only</SelectItem>
              <SelectItem value="non-recurring">Non-Recurring Only</SelectItem>
            </SelectContent>
          </Select>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => dispatch({ type: "SET_DELETE_DIALOG", open })}
              >
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      loading={deleteLoading}
                      disabled={selectedIds.length === 0}
                      className="flex items-center"
                    >
                      <Trash className="h-4 w-4 md:mr-0" /> {/* Adjust margin on desktop */}
                      <span className="hidden md:inline">
                        {deleteLoading ? "Deleting" : `Delete Selected (${selectedIds.length})`}
                      </span>
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete{" "}
                      {selectedIds.length} transaction(s) from your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmBulkDelete}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          {(searchTerm || typeFilter || recurringFilter) && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleClearFilters}
              title="Clear Filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "rounded-md border transition-opacity duration-300",
          (isPending || deleteLoading) && "opacity-60",
        )}
        aria-busy={isPending || deleteLoading || undefined}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("date")}>
                <div className="flex items-center">
                  Date
                  {sortField === "date" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-3 w-3" />
                    ) : (
                      <ChevronDown className="ml-1 h-3 w-3" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("category")}>
                <div className="flex items-center">
                  Category
                  {sortField === "category" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-3 w-3" />
                    ) : (
                      <ChevronDown className="ml-1 h-3 w-3" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("amount")}>
                <div className="flex items-center justify-end">
                  Amount
                  {sortField === "amount" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-3 w-3" />
                    ) : (
                      <ChevronDown className="ml-1 h-3 w-3" />
                    ))}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">Recurring</div>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: Math.min(transactions.length || 5, 5) }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <Skeleton className="size-4 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="size-4 rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No Transactions
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction: TableTransaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Checkbox
                      onCheckedChange={() => handleSelect(transaction.id)}
                      checked={selectedIds.includes(transaction.id)}
                      aria-label="Select all transactions"
                    />
                  </TableCell>
                  <TableCell>{format(new Date(transaction.date), "PP")}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <span
                      style={{
                        background: categoryColors[transaction.category],
                      }}
                      className="px-2 py-1 rounded text-white text-sm"
                    >
                      {transaction.category}
                    </span>
                  </TableCell>
                  <TableCell
                    className="text-right font-medium"
                    style={{
                      color: transaction.type === "EXPENSE" ? "red" : "green",
                    }}
                  >
                    {transaction.type === "EXPENSE" ? "−" : "+"}${usd(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    {transaction.isRecurring ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge
                              variant="outline"
                              className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200"
                            >
                              <RefreshCcw className="h-3 w-3" />
                              {transaction.recurringInterval &&
                                RECURRING_INTERVALS[transaction.recurringInterval]}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <div className="font-medium">Next Date: </div>
                              {transaction.nextRecurringDate && (
                                <div>{format(new Date(transaction.nextRecurringDate), "PP")}</div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        One-Time
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => router.push(`/transaction/create?edit=${transaction.id}`)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteFn([transaction.id])}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4">
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          searchParams={urlSearchParams}
          startTransition={startTransition}
        />
      </div>
    </div>
  );
};

export default TransactionsTable;
