import arcjet, { tokenBucket } from "@arcjet/next";

import { env } from "@/lib/env";

const aj = arcjet({
  key: env.ARCJET_KEY ?? "",
  characteristics: ["userId"], // Track based on Neon Auth userId
  rules: [
    // Rate limiting specifically for collection creation
    tokenBucket({
      mode: "LIVE",
      refillRate: 10, // 10 collections
      interval: 3600, // per hour
      capacity: 10, // maximum burst capacity
    }),
  ],
});

export default aj;
