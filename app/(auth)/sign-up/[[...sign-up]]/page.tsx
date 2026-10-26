"use client";

import Link from "next/link";
import { useReducer } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { BackLink } from "@/components/auth/back-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordStrength } from "@/components/auth/password-strength";
import { type AuthAction, authFormReducer, initialAuthFormState } from "@/lib/auth-form-state";
import { mapAuthError, retryAfterFromResponse } from "@/lib/auth-errors";
import { signUpSchema, type SignUpInput } from "@/lib/schema";

export default function SignUpPage() {
  const [state, dispatch] = useReducer(authFormReducer, initialAuthFormState);
  const busy = state.status === "submitting";
  const form = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema), mode: "onBlur" });
  const password = form.watch("password") ?? "";

  const handleSubmit = form.handleSubmit(async (values) => {
    if (busy) return;
    dispatch({ type: "START", action: "submit" });
    try {
      const res = await fetch("/api/auth/sign-up/email", {
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
      const data = await res.json().catch(() => ({}));
      if (data.token === null) {
        dispatch({ type: "AWAITING" });
        toast.success("Check your email to verify your account.");
        return;
      }
      window.location.assign("/dashboard");
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
      <h2 className="text-2xl font-bold">Sign Up</h2>
      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}
      {state.status === "awaiting-verification" && (
        <div className="rounded-md border bg-muted p-3 text-sm">
          Check your email to verify your account.
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <Input id="name" aria-invalid={!!errors.name} {...form.register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <Input id="email" type="email" aria-invalid={!!errors.email} {...form.register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          type="password"
          aria-invalid={!!errors.password}
          {...form.register("password")}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        <PasswordStrength password={password} />
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
        Sign Up
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
