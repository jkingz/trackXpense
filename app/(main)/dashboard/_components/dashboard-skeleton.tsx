import { Skeleton } from "@/components/ui/skeleton";

export function KpiSkeleton() {
  return (
    <div className="ledger-panel">
      <div className="flex flex-col gap-2 px-5 py-5 sm:px-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="grid divide-y divide-border border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2 px-5 py-3 sm:px-6">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartsSkeleton({ showBudget = true }: { showBudget?: boolean }) {
  return (
    <>
      <div className="ledger-panel p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-5 h-36 w-full sm:h-44" />
        <Skeleton className="mt-4 h-20 w-full" />
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <div className="ledger-panel p-5">
          <Skeleton className="h-4 w-36" />
          <div className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </div>
        </div>
        {showBudget && <BudgetSkeleton />}
      </div>
      <div className="ledger-panel">
        <div className="border-b px-5 py-4">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function BudgetSkeleton() {
  return (
    <div className="ledger-panel p-5">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="size-7 rounded-md" />
      </div>
      <Skeleton className="mt-4 h-7 w-40" />
      <Skeleton className="mt-5 h-2 w-full rounded-full" />
      <Skeleton className="mt-3 h-3 w-28" />
    </div>
  );
}

export function YearSkeleton() {
  return (
    <div className="ledger-panel flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <Skeleton className="h-4 w-36" />
      <div className="flex gap-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-8 w-40" />
      <KpiSkeleton />
      <ChartsSkeleton />
      <YearSkeleton />
    </div>
  );
}
