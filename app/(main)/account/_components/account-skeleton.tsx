import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors the account screen: identity row, running balance, the balance chart,
 * then the transaction table's toolbar and rows. Heights match the resolved
 * components so the page does not jump when the data lands.
 */
export default function AccountSkeleton() {
  return (
    <div className="space-y-8 px-5" aria-busy="true" aria-live="polite">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-14 w-64 rounded-md" />
          <Skeleton className="mt-3 h-4 w-32" />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="ml-auto h-7 w-28" />
          <Skeleton className="ml-auto h-4 w-24" />
        </div>
      </div>

      {/* Balance chart */}
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-6 h-[280px] w-full rounded-md" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[110px] rounded-md" />
          <Skeleton className="h-9 w-[170px] rounded-md" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="flex items-center gap-4 border-b px-4 py-3">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-4 py-3.5">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
