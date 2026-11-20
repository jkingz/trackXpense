import { Skeleton } from "@/components/ui/skeleton";

/**
 * These mirror the geometry of the resolved dashboard so nothing shifts when a
 * boundary fills in. One export per region, so each region suspends on its own
 * query instead of the whole screen waiting on the slowest one.
 */

export function HeroSkeleton() {
  return (
    <div className="h-full min-h-96 rounded-3xl bg-indigo p-6 sm:p-10" aria-hidden>
      <Skeleton className="h-4 w-40 bg-white/15" />
      <Skeleton className="mt-4 h-16 w-72 bg-white/15" />
      <Skeleton className="mt-12 h-10 w-80 bg-white/15" />
      <Skeleton className="mt-10 h-14 w-full bg-white/80" />
    </div>
  );
}

export function BudgetSkeleton() {
  return (
    <div className="h-44 rounded-3xl bg-navy p-6" aria-hidden>
      <Skeleton className="h-4 w-32 bg-white/15" />
      <Skeleton className="mt-5 h-8 w-48 bg-white/15" />
      <Skeleton className="mt-5 h-2.5 w-full bg-white/15" />
    </div>
  );
}

export function ChartsSkeleton() {
  return (
    <>
      <div className="rounded-3xl border bg-card p-8 lg:col-span-8" aria-hidden>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-4 w-56" />
        <Skeleton className="mt-8 h-48 w-full" />
      </div>
      <div className="rounded-3xl border bg-card p-8 lg:col-span-4" aria-hidden>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-6 h-2.5 w-full" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </>
  );
}

export function RecentSkeleton() {
  return (
    <div className="rounded-3xl border bg-card p-8 lg:col-span-12" aria-hidden>
      <Skeleton className="h-5 w-40" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-6 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <HeroSkeleton />
      </div>
      <div className="flex flex-col gap-6 lg:col-span-4">
        <Skeleton className="h-48 rounded-3xl" />
        <BudgetSkeleton />
      </div>
      <ChartsSkeleton />
      <RecentSkeleton />
    </div>
  );
}
