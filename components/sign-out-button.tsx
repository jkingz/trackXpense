"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="ghost" size="icon" title="Sign out" type="submit" disabled={pending}>
      <LogOut className="size-4" />
    </Button>
  );
}
