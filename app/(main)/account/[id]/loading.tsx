import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the account page geometry (header, chart card, table) so nothing shifts when it resolves. */
export default function Loading() {
  return (
    <div className="space-y-8 md:px-5" aria-busy="true" aria-label="Loading account">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-8 w-48 sm:h-9" />
          <Skeleton className="mt-2 h-4 w-20" />
        </div>
        <div className="flex flex-col items-end">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="mt-2 h-7 w-32 sm:h-8" />
        </div>
      </div>

      <div className="space-y-8">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-9 w-37.5" />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="mx-auto h-10 w-24" />
            ))}
          </div>
          <Skeleton className="mt-6 h-82.5 w-full" />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="space-y-2 rounded-md border p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
