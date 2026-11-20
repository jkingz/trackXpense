import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const { db } = vi.hoisted(() => ({
  db: { transaction: { findMany: vi.fn(async (_args: { where: { date: { gte: Date } } }) => []) } },
}));

vi.mock("@/actions/lib/checkUser", () => ({ checkUser: async () => ({ id: "me" }) }));
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { getDashboardData } from "@/actions/dashboard";

const sinceFor = async (now: Date) => {
  vi.useFakeTimers({ now });
  await getDashboardData();
  return db.transaction.findMany.mock.lastCall?.[0].where.date.gte;
};

afterEach(() => {
  vi.useRealTimers();
});

describe("getDashboardData", () => {
  it("loads from Jan 1 late in the year (covers the year view)", async () => {
    expect(await sinceFor(new Date(2026, 10, 21))).toEqual(new Date(2026, 0, 1));
  });

  it("reaches into last year early in the year (covers the 6-month bars)", async () => {
    expect(await sinceFor(new Date(2026, 1, 10))).toEqual(new Date(2025, 8, 1));
  });
});
