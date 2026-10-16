"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  extraStyles,
  ...props
}: ProgressPrimitive.Root.Props & {
  extraStyles?: string;
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
