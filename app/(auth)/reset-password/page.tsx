"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useReducer } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { BackLink } from "@/components/auth/back-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authFormReducer, initialAuthFormState } from "@/lib/auth-form-state";
import { mapAuthError, retryAfterFromResponse } from "@/lib/auth-errors";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/schema";

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const error = params.get("error");
  const [state, dispatch] = useReducer(authFormReducer, initialAuthFormState);
  const busy = state.status === "submitting";
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
  });

  if (!token || error === "INVALID_TOKEN") {
    return (
      <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <BackLink />
        <h2 className="text-2xl font-bold">Reset password</h2>
        <p className="text-sm text-destructive">This link is invalid or has expired.</p>
        <a href="/forgot-password" className="text-brand hover:underline text-sm">
          Request a new link
        </a>
      </div>
    );
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    if (busy) return;
    dispatch({ type: "START", action: "submit" });
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: values.password, token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = mapAuthError({
          status: res.status,
          code: data.code,
          retryAfter: retryAfterFromResponse(res),
        });
        if (res.status >= 500 || res.status === 429) toast.error(msg);
        else dispatch({ type: "FAIL", action: "submit", message: msg });
        dispatch({ type: "FAIL", action: "submit", message: msg });
        return;
      }
      toast.success("Password changed. Sign in with your new password.");
      window.location.assign("/sign-in");
    } catch {
      const msg = "Network error. Try again.";
      toast.error(msg);
      dispatch({ type: "FAIL", action: "submit", message: msg });
    }
  });

  const errors = form.formState.errors;
  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
      <BackLink />
      <h2 className="text-2xl font-bold">Reset password</h2>
      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium">
          New password
        </label>
        <Input
          id="password"
          type="password"
          aria-invalid={!!errors.password}
          {...form.register("password")}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="block text-sm font-medium">
          Confirm password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          aria-invalid={!!errors.confirmPassword}
          {...form.register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>
      <Button type="submit" loading={busy} disabled={busy} className="w-full">
        Reset password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">Loading…</div>}
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
