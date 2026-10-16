import { Skeleton } from "@/components/ui/skeleton";

/**
 * These mirror the geometry of the resolved dashboard so nothing shifts when a
 * boundary fills in. One export per region, so each region suspends on its own
 * query instead of the whole screen waiting on the slowest one.
 */

export function KpiSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="glass-panel flex flex-col px-4 py-3 text-center">
          <Skeleton className="mx-auto h-3.5 w-32" />
          <div className="flex flex-1 flex-col items-center justify-center py-1">
            <Skeleton className="h-7 w-32" />
          </div>
          <Skeleton className="mx-auto h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

/** The three KPI cards as bare grid items, for the section boundary inside the page grid. */
export function KpiCardsSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="glass-panel flex flex-col px-4 py-3 text-center">
          <Skeleton className="mx-auto h-3.5 w-32" />
          <div className="flex flex-1 flex-col items-center justify-center py-1">
            <Skeleton className="h-7 w-32" />
          </div>
          <Skeleton className="mx-auto h-3 w-28" />
        </div>
      ))}
    </>
  );
}

export function ChartsSkeleton() {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-3">
      <div className="glass-panel p-5">
        <div className="flex items-baseline justify-between gap-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="mx-auto mt-4 size-40 max-w-55 rounded-full" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
      </div>
      <div className="glass-panel p-5">
        <div className="flex items-baseline justify-between gap-4">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="mt-4 h-40 w-full rounded-lg" />
        <div className="mt-4 border-t pt-4">
          <div className="flex items-baseline justify-between gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="mt-3 grid grid-cols-7 items-end gap-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
      <div className="glass-panel">
        <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-5 py-3">
              <Skeleton className="size-2 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BudgetSkeleton() {
  return (
    <div className="glass-panel px-4 py-3">
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
    <div className="glass-panel flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4">
      <div>
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-2 h-3 w-24" />
      </div>
      <div className="ml-auto flex items-baseline gap-8">
        <div className="space-y-2 text-right">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </div>
  );
}

/** The whole page at once, for the route-level boundary. */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <YearSkeleton />
      <KpiSkeleton />
      <ChartsSkeleton />
    </div>
  );
}
