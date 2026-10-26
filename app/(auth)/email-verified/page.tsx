"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function EmailVerifiedContent() {
  const params = useSearchParams();
  const error = params.get("error");

  if (error) {
    return (
      <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-2xl font-bold">Verification failed</h2>
        <p className="text-sm text-muted-foreground">
          The verification link is invalid or expired.
        </p>
        <Link href="/sign-in" className="text-brand hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="text-2xl font-bold">Email verified</h2>
      <p className="text-sm text-muted-foreground">Your email has been verified.</p>
      <Link href="/sign-in" className="text-brand hover:underline">
        Sign in
      </Link>
    </div>
  );
}

export default function EmailVerifiedPage() {
  return (
    <Suspense
      fallback={<div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">Loading…</div>}
    >
      <EmailVerifiedContent />
    </Suspense>
  );
}
