/**
 * Creates the demo account if missing and rewrites its ledger.
 *
 *   pnpm db:seed
 *
 * Touches only the demo user's rows. Other users are never read or written.
 */
import { db } from "../lib/prisma";
import { ensureDemoUser, resetDemoLedger } from "../lib/demo";

async function main() {
  try {
    const user = await ensureDemoUser();
    await resetDemoLedger(user.id);
    console.log(`demo ledger written for ${user.email}`);
  } catch (error) {
    console.error("seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

void main();
