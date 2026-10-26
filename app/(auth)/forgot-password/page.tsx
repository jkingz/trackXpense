"use client";

import Link from "next/link";
import { useReducer } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { BackLink } from "@/components/auth/back-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authFormReducer, initialAuthFormState } from "@/lib/auth-form-state";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/schema";

export default function ForgotPasswordPage() {
  const [state, dispatch] = useReducer(authFormReducer, initialAuthFormState);
  const busy = state.status === "submitting";
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    if (busy) return;
    dispatch({ type: "START", action: "submit" });
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, redirectTo: "/reset-password" }),
      });
      if (!res.ok) {
        toast.error("Something went wrong. Try again.");
        dispatch({ type: "FAIL", action: "submit", message: "Something went wrong. Try again." });
        return;
      }
      toast.success("If this email exists, a reset link has been sent.");
      dispatch({
        type: "FAIL",
        action: "submit",
        message: "If this email exists, a reset link has been sent.",
      });
    } catch {
      toast.error("Network error. Try again.");
      dispatch({ type: "FAIL", action: "submit", message: "Network error. Try again." });
    }
  });

  const errors = form.formState.errors;
  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
      <BackLink />
      <h2 className="text-2xl font-bold">Forgot password</h2>
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <Input id="email" type="email" aria-invalid={!!errors.email} {...form.register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <Button type="submit" loading={busy} disabled={busy} className="w-full">
        Send reset link
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="text-brand hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
