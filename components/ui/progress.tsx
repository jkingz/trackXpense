"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";

import { cn } from "@/lib/utils";

/**
 * `aria-label` is required, not optional: Base UI renders `role="progressbar"`,
 * and a progressbar needs an accessible name. Making it required here means a
 * new bar cannot be added unnamed.
 */
function Progress({
  className,
  value,
  extraStyles,
  ...props
}: Omit<ProgressPrimitive.Root.Props, "aria-label"> & {
  extraStyles?: string;
  "aria-label": string;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("bg-primary/20 relative h-2 w-full overflow-hidden rounded-full", className)}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Track data-slot="progress-track" className="h-full w-full">
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn("bg-primary h-full w-full flex-1 transition-all", extraStyles)}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
