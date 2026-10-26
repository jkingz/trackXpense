"use client";

import Link from "next/link";
import { useReducer } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { BackLink } from "@/components/auth/back-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type AuthAction, authFormReducer, initialAuthFormState } from "@/lib/auth-form-state";
import { mapAuthError, retryAfterFromResponse } from "@/lib/auth-errors";
import { signInSchema, type SignInInput } from "@/lib/schema";

export default function SignInPage() {
  const [state, dispatch] = useReducer(authFormReducer, initialAuthFormState);
  const busy = state.status === "submitting";
  const form = useForm<SignInInput>({ resolver: zodResolver(signInSchema), mode: "onBlur" });

  const goToDashboard = () => window.location.assign("/dashboard");

  const handleSubmit = form.handleSubmit(async (values) => {
    if (busy) return;
    dispatch({ type: "START", action: "submit" });
    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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
      goToDashboard();
    } catch {
      const msg = "Network error. Try again.";
      toast.error(msg);
      dispatch({ type: "FAIL", action: "submit", message: msg });
    }
  });

  const handleDemo = async () => {
    if (busy) return;
    dispatch({ type: "START", action: "demo" });
    try {
      const res = await fetch("/api/demo", { method: "POST" });
      if (!res.ok) {
        const msg = "Demo is unavailable right now";
        toast.error(msg);
        dispatch({ type: "FAIL", action: "demo", message: msg });
        return;
      }
      goToDashboard();
    } catch {
      const msg = "Network error. Try again.";
      toast.error(msg);
      dispatch({ type: "FAIL", action: "demo", message: msg });
    }
  };

  const label = (action: AuthAction, idle: string, pending: string) =>
    state.pending === action ? pending : idle;

  const errors = form.formState.errors;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
      <BackLink />
      <h2 className="text-2xl font-bold">Sign In</h2>

      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-err" : undefined}
          {...form.register("email")}
        />
        {errors.email && (
          <p id="email-err" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          type="password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "pw-err" : undefined}
          {...form.register("password")}
        />
        {errors.password && (
          <p id="pw-err" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" loading={busy} disabled={busy} className="w-full">
        {label("submit", "Sign In", "Signing in…")}
      </Button>

      <Button
        type="button"
        variant="outline"
        loading={busy}
        onClick={handleDemo}
        className="w-full"
      >
        {label("demo", "Try the demo", "Opening the demo…")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="text-brand hover:underline">
          Forgot password?
        </Link>
      </p>
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link href="/sign-up" className="text-brand hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
