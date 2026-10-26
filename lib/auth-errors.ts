export type AuthErrorInput = { status?: number; code?: string; retryAfter?: string | null };

export function mapAuthError(input: AuthErrorInput): string {
  const code = input.code?.toUpperCase();
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Invalid email or password.";
    case "EMAIL_NOT_VERIFIED":
      return "Please verify your email before signing in.";
    case "PASSWORD_TOO_SHORT":
      return "Password must be at least 8 characters.";
    case "PASSWORD_TOO_LONG":
      return "Password must be at most 128 characters.";
    case "PASSWORD_COMPROMISED":
      return "This password has appeared in a data breach. Choose another.";
    case "INVALID_TOKEN":
      return "This link is invalid or has expired.";
    default:
      break;
  }
  if (input.status === 429) {
    const retry = input.retryAfter ? `${input.retryAfter}s` : "a moment";
    return `Too many attempts. Try again in ${retry}.`;
  }
  if (input.status && input.status >= 500) return "Something went wrong. Try again.";
  return "Something went wrong. Try again.";
}

export function retryAfterFromResponse(res: Response): string | null {
  return res.headers.get("X-Retry-After") ?? res.headers.get("Retry-After");
}
