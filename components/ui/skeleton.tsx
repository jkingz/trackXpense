import { cn } from "@/lib/utils";

/**
 * Placeholder shape for content that has not arrived yet. Skeletons mirror the
 * geometry of the real thing so the layout does not jump on hydration; use them
 * as a Suspense `fallback` rather than as a spinner.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
