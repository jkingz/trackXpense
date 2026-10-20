"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";

import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      title="Sign out"
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await signOutAction();
          // Full reload, not router navigation: the router has the landing page
          // cached from a signed-in prefetch, and a client-side redirect would
          // serve that stale header. (actions/auth.ts explains why not
          // revalidatePath.)
          window.location.assign("/");
        })
      }
    >
      <LogOut className="size-4" />
    </Button>
  );
}
