"use client";

import Link from "next/link";
import { useReducer, useState } from "react";

import { BackLink } from "@/components/auth/back-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type AuthAction, authFormReducer, initialAuthFormState } from "@/lib/auth-form-state";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, dispatch] = useReducer(authFormReducer, initialAuthFormState);
  const busy = state.status === "submitting";

  /**
   * The session cookie is set by the fetch above, so a client-side push can
   * land on a dashboard rendered from a pre-auth server cache. A hard
   * navigation makes the first dashboard request carry the cookie.
   */
  const goToDashboard = () => window.location.assign("/dashboard");

  const handleDemo = async () => {
    if (busy) return;
    dispatch({ type: "START", action: "demo" });
    try {
      const res = await fetch("/api/demo", { method: "POST" });
      if (!res.ok) {
        dispatch({ type: "FAIL", action: "demo", message: "Demo is unavailable right now" });
        return;
      }
      goToDashboard();
    } catch (error) {
      dispatch({
        type: "FAIL",
        action: "demo",
        message: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    dispatch({ type: "START", action: "submit" });

    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Sign in failed");
      }

      goToDashboard();
    } catch (err) {
      dispatch({
        type: "FAIL",
        action: "submit",
        message: err instanceof Error ? err.message : "An error occurred",
      });
    }
  };

  const label = (action: AuthAction, idle: string, pending: string) =>
    state.pending === action ? pending : idle;

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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <Button type="submit" loading={busy} className="w-full">
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
        Don't have an account?{" "}
        <Link href="/sign-up" className="text-brand hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
