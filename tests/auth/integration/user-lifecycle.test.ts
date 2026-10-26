import { afterEach, describe, expect, it } from "vite-plus/test";

import { db } from "@/lib/prisma";

const email = `it-${crypto.randomUUID()}@trackxpense.local`;

afterEach(async () => {
  await db.user.deleteMany({ where: { email } });
});

describe("integration: user lifecycle", () => {
  it("persists a user and reads it back", async () => {
    const created = await db.user.create({
      data: { email, name: "Integration User", emailVerified: true },
    });

    const found = await db.user.findUnique({ where: { email } });
    expect(found?.id).toBe(created.id);
    expect(found?.emailVerified).toBe(true);
  });

  it("cascades sessions when the user is deleted", async () => {
    const user = await db.user.create({ data: { email, name: "Integration User" } });
    await db.session.create({
      data: {
        id: crypto.randomUUID(),
        token: crypto.randomUUID(),
        userId: user.id,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await db.user.delete({ where: { id: user.id } });
    expect(await db.session.count({ where: { userId: user.id } })).toBe(0);
  });
});
