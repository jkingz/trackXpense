export type PasswordScore = 0 | 1 | 2 | 3 | 4;

export function scorePassword(password: string, context?: { email?: string; name?: string }) {
  let score = 0;
  const suggestions: string[] = [];
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) =>
    r.test(password),
  ).length;
  if (classes >= 3) score++;
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    suggestions.push("Avoid repeated characters");
  }
  if (/abc|123|qwerty/i.test(password)) {
    score = Math.max(0, score - 1);
    suggestions.push("Avoid common sequences");
  }
  const local = context?.email?.split("@")[0];
  if (local && password.toLowerCase().includes(local.toLowerCase())) {
    score = 0;
    suggestions.push("Don't use your email");
  }
  if (context?.name && password.toLowerCase().includes(context.name.toLowerCase())) {
    score = 0;
    suggestions.push("Don't use your name");
  }
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
  return {
    score: Math.min(4, score) as PasswordScore,
    label: labels[Math.min(4, score)],
    suggestions,
  };
}
