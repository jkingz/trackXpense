import { z } from "zod";

/**
 * Single authority for server-side input validation. Parses `data` against
 * `schema` and returns the typed result; throws ZodError on failure.
 */
export function parseInput<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data);
}
