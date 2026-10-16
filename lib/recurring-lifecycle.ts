import { calculateNextRecurringDate } from "@/actions/lib";

export type RecurringClock = {
  lastProcessed: Date | null;
  nextRecurringDate: Date | null;
};

export type RecurringPhase = "due" | "scheduled";

// Never processed, or no next date, counts as due; a missing next date behaves
// like the epoch. A dated next occurrence is due only once it is not in the future.
export function recurringPhase(clock: RecurringClock, now: Date): RecurringPhase {
  if (!clock.lastProcessed) return "due";
  if (!clock.nextRecurringDate) return "due";
  return clock.nextRecurringDate <= now ? "due" : "scheduled";
}

export function applyRecurringTick(
  clock: RecurringClock,
  event: { now: Date; interval: string | null | undefined },
): RecurringClock {
  return {
    lastProcessed: event.now,
    nextRecurringDate: calculateNextRecurringDate(event.now, event.interval),
  };
}
