import { cn } from "@/lib/utils";

type DotPatternProps = {
  className?: string;
  /** Spacing between dots. */
  size?: "sm" | "md" | "lg";
  /** How the field dissolves toward the edges. */
  fade?: "ellipse" | "circle" | "none";
};

const SIZE = {
  sm: "[background-size:12px_12px]",
  md: "[background-size:16px_16px]",
  lg: "[background-size:22px_22px]",
};

const FADE = {
  ellipse: "[mask-image:radial-gradient(ellipse_60%_55%_at_50%_40%,#000_65%,transparent_100%)]",
  circle: "[mask-image:radial-gradient(circle_at_50%_50%,#000_60%,transparent_100%)]",
  none: "",
};

/**
 * Graph-paper field for section backgrounds — the ledger is the subject, so the
 * page is allowed to look like ledger paper. Purely decorative: always
 * aria-hidden and pointer-events-none.
 */
function DotPattern({ className, size = "md", fade = "ellipse" }: DotPatternProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "--dot-grid pointer-events-none absolute inset-0 opacity-70",
        SIZE[size],
        FADE[fade],
        className,
      )}
    />
  );
}

/**
 * Soft brand light. Sits behind a block and bleeds outward, so sections read as
 * lit rather than flat.
 */
function BrandGlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute size-[28rem] rounded-full bg-brand/20 blur-[100px]",
        className,
      )}
    />
  );
}

export { DotPattern, BrandGlow };
