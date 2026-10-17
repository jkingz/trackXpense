import { NextResponse } from "next/server";

import { checkHealth } from "@/lib/health";
import { db } from "@/lib/prisma";

/** Liveness probe: DB ping shaped by lib/health. 200 when the ledger is reachable, 503 when not.
    Builds as ƒ (dynamic), so every hit pings — no stale "up". */
export async function GET() {
  const result = await checkHealth(() => db.$queryRaw`SELECT 1`);
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
