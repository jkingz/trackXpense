import { cn } from "@/lib/utils";

/**
 * The one indeterminate loader in the app. Replaces react-spinners' BarLoader
 * and its hardcoded colour so pending states read as part of the system, and it
 * says nothing about progress it cannot know.
 */
export function PendingRail({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("h-0.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <span className="--pending-rail block h-full w-1/4 rounded-full bg-brand-deep">
        <span className="sr-only">{label}</span>
      </span>
    </div>
  );
}

export default PendingRail;
