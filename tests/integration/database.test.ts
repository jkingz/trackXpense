import { describe, expect, it } from "vite-plus/test";

import { db } from "@/lib/prisma";

describe("database (integration)", () => {
  it.skipIf(!process.env.DATABASE_URL)("can reach the database", async () => {
    const count = await db.user.count();
    expect(typeof count).toBe("number");
  });
});
