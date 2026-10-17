"use client";

import Link from "next/link";
import { useReducer, useState } from "react";

import { BackLink } from "@/components/auth/back-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authFormReducer, initialAuthFormState } from "@/lib/auth-form-state";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [state, dispatch] = useReducer(authFormReducer, initialAuthFormState);
  const busy = state.status === "submitting";

  /**
   * The session cookie is set by the fetch above, so a client-side push can
   * land on a dashboard rendered from a pre-auth server cache. A hard
   * navigation makes the first dashboard request carry the cookie.
   */
  const goToDashboard = () => window.location.assign("/dashboard");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    dispatch({ type: "START", action: "submit" });

    try {
      const res = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Sign up failed");
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
      <BackLink />
      <h2 className="text-2xl font-bold">Create Account</h2>

      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium">
          Full Name
        </label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

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
        {busy ? "Creating account…" : "Create Account"}
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
