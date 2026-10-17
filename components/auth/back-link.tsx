import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/** Escape hatch from either auth card. Both pages render this in the same slot. */
export function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <ArrowLeft className="size-4" />
      Back to home
    </Link>
  );
}
