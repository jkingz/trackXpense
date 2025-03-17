'use client';
import { bulkDeleteTransactions } from '@/actions/accounts';
import PaginationControls from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { categoryColors } from '@/data/categories';
import useFetch from '@/hooks/use-fetch';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MoreHorizontal,
  RefreshCcw,
  Search,
  Trash,
  X,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { BarLoader } from 'react-spinners';
import { toast } from 'sonner';

const RECURRING_INTERVALS = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};
const ITEMS_PER_PAGE = 10;

const TransactionsTable = ({ transactions, totalItems, searchParams }) => {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const [isPending, startTransition] = useTransition(); // Detect URL transitions

  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.search || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.type || '');
  const [recurringFilter, setRecurringFilter] = useState(
    searchParams.recurring || ''
  );

  const currentPage = parseInt(urlSearchParams.get('page') || '1', 10);
  const sortField = urlSearchParams.get('sortField') || 'date';
  const sortDirection = urlSearchParams.get('sortDirection') || 'desc';
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deleted,
  } = useFetch(bulkDeleteTransactions);

  // Handle sorting
  const handleSort = (field) => {
    const newDirection =
      field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    const params = new URLSearchParams(urlSearchParams.toString());
    params.set('sortField', field);
    params.set('sortDirection', newDirection);
    startTransition(() => router.push(`?${params.toString()}`));
  };

  // Handle single selection
  const handleSelect = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds((current) =>
        current.length === transactions.length
          ? []
          : transactions.map((t) => t.id)
      );
    } else {
      setSelectedIds([]);
    }
  };

  const allSelected =
    transactions.length > 0 && selectedIds.length === transactions.length;

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete these ${selectedIds.length} transactions?`
      )
    )
      return;

    const response = await deleteFn(selectedIds);
    if (response?.success) {
      setSelectedIds([]);
      router.refresh();
    }
  };

  useEffect(() => {
    if (deleted && !deleteLoading) {
      toast.success('Transactions deleted');
    }
  }, [deleted, deleteLoading]);

  // Handle filter updates
  const updateSearchParams = (key, value) => {
    const params = new URLSearchParams(urlSearchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset to page 1 on filter change
    startTransition(() => router.push(`?${params.toString()}`));
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setRecurringFilter('');
    setSelectedIds([]);
    startTransition(() => router.push('?page=1'));
  };

  return (
    <div className="space-y-4">
      {/* Show BarLoader during delete or URL transitions */}
      {(deleteLoading || isPending) && (
        <BarLoader className="mt-4" width={'100%'} height={5} color="#0ea5e9" />
      )}

      {/* Filters section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              updateSearchParams('search', e.target.value);
            }}
            className="pl-8 shadow-none focus:ring-1 focus:ring-ring border border-input"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value);
              updateSearchParams('type', value);
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
              setRecurringFilter(value);
              updateSearchParams('recurring', value);
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
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={deleteLoading || selectedIds.length === 0}
              >
                <Trash className="mr-2 h-4 w-4" />
                {deleteLoading
                  ? 'Deleting...'
                  : `Delete Selected (${selectedIds.length})`}
              </Button>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  Date
                  {sortField === 'date' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className="ml-1 h-3 w-3" />
                    ) : (
                      <ChevronDown className="ml-1 h-3 w-3" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  Category
                  {sortField === 'category' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className="ml-1 h-3 w-3" />
                    ) : (
                      <ChevronDown className="ml-1 h-3 w-3" />
                    ))}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center justify-end">
                  Amount
                  {sortField === 'amount' &&
                    (sortDirection === 'asc' ? (
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
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No Transactions
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Checkbox
                      onCheckedChange={() => handleSelect(transaction.id)}
                      checked={selectedIds.includes(transaction.id)}
                      aria-label="Select all transactions"
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(transaction.date), 'PP')}
                  </TableCell>
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
                      color: transaction.type === 'EXPENSE' ? 'red' : 'green',
                    }}
                  >
                    {transaction.type === 'EXPENSE' ? '-' : '+'}$
                    {transaction.amount.toFixed(2)}
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
                              {
                                RECURRING_INTERVALS[
                                  transaction.recurringInterval
                                ]
                              }
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <div className="font-medium">Next Date: </div>
                              <div>
                                {format(
                                  new Date(transaction.nextRecurringDate),
                                  'PP'
                                )}
                              </div>
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
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/transaction/create?edit=${transaction.id}`
                            )
                          }
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
        />
      </div>
    </div>
  );
};

export default TransactionsTable;
