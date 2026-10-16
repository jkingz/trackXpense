import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors the add-transaction form: heading, the account picker, the stacked
 * field rows, then the action pair, so the form does not resize as it arrives.
 */
export default function TransactionFormSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5" aria-busy="true" aria-live="polite">
      <Skeleton className="h-14 w-72 rounded-md" />

      <div className="space-y-5 rounded-xl border bg-card p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}

        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 rounded-md" />
          <Skeleton className="h-10 rounded-md" />
        </div>

        <div className="flex gap-4 pt-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
