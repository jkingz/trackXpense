"use client";

import { ArrowUpRight } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function DemoButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      className="min-h-12 rounded-full px-6 text-base"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            const response = await fetch("/api/demo", { method: "POST" });
            if (!response.ok) throw new Error("Demo sign-in failed");
            window.location.assign("/dashboard");
          } catch {
            toast.error("The demo is unavailable right now. Try again in a moment.");
          }
        })
      }
    >
      {pending ? "Opening the demo…" : "Try the demo"}
      <ArrowUpRight aria-hidden data-icon="inline-end" />
    </Button>
  );
}
