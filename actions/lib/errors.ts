export const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";
