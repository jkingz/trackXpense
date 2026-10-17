export type HealthResult =
  | { ok: true; database: "up"; latencyMs: number }
  | { ok: false; database: "down"; error: string };

/**
 * Liveness probe seam. The caller supplies the ping (usually a one-row DB
 * query); this shapes the result and times it so routes stay thin and the
 * contract is testable without a database.
 */
export async function checkHealth(ping: () => Promise<unknown>): Promise<HealthResult> {
  const started = Date.now();
  try {
    await ping();
    return { ok: true, database: "up", latencyMs: Date.now() - started };
  } catch (error) {
    return {
      ok: false,
      database: "down",
      error: error instanceof Error ? error.message : "unknown",
    };
  }
}
