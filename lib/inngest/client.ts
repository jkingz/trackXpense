import { Inngest } from "inngest";

import { env } from "@/lib/env";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "finance",
  name: "Finance",
  eventKey: env.INNGEST_EVENT_KEY,
  retryFunctions: async (attempt: number) => ({
    delay: Math.pow(2, attempt) * 1000,
    maxAttempts: 2,
  }),
});
