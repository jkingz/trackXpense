"use client";

import { scorePassword } from "@/lib/password-strength";

export function PasswordStrength({ password }: { password: string }) {
  const { score, label } = scorePassword(password);
  return (
    <div
      role="progressbar"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={4}
      aria-label={label}
    >
      <div className="h-2 w-full bg-muted">
        <div className="h-2 bg-brand" style={{ width: `${(score / 4) * 100}%` }} />
      </div>
      <span className="text-xs">{label}</span>
    </div>
  );
}
