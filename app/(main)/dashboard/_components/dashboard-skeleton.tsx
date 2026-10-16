import { Skeleton } from "@/components/ui/skeleton";

/**
 * These mirror the geometry of the resolved dashboard so nothing shifts when a
 * boundary fills in. One export per region, so each region suspends on its own
 * query instead of the whole screen waiting on the slowest one.
 */

export function SummarySkeleton() {
  return (
    <div className="rounded-2xl border bg-card px-6 py-7 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div>
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="mt-3 h-10 w-56" />
        </div>
        <div className="flex gap-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-[150px] rounded-md" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-5 py-3.5">
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

      <div className="rounded-2xl border bg-card px-5 py-4">
        <div className="flex items-baseline justify-between gap-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="mt-5 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-16" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BudgetSkeleton() {
  return (
    <div className="rounded-2xl border bg-card px-5 py-4">
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

export function AccountsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex items-center justify-between gap-4 border-b px-5 py-3.5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-9 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** The whole page at once, for the route-level boundary. */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <div className="flex items-end justify-between gap-4 border-b pb-6">
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-9 w-48" />
        </div>
        <Skeleton className="h-9 w-44 rounded-md" />
      </div>
      <SummarySkeleton />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivitySkeleton />
        </div>
        <div className="space-y-6">
          <BudgetSkeleton />
          <AccountsSkeleton />
        </div>
      </div>
    </div>
  );
}
