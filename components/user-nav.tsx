"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

import { signOutAction } from "@/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Signed-in half of the header: the ledger and budget links (folded into the avatar
 * menu below `md`), the theme control, and the avatar that signs out.
 */
export function UserNav({ name, ledgerHref }: { name: string; ledgerHref: string | null }) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const links = ledgerHref
    ? [
        { label: "Ledger", href: ledgerHref, active: pathname.startsWith("/account/") },
        { label: "Budget", href: "/dashboard", active: pathname === "/dashboard" },
      ]
    : [];

  const signOut = () =>
    startTransition(async () => {
      await signOutAction();
      // Full reload, not router navigation: the router has the landing page cached
      // from a signed-in prefetch and would serve that stale header.
      window.location.assign("/");
    });

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {links.length > 0 && (
        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              transitionTypes={["ledger-budget"]}
              aria-current={link.active ? "page" : undefined}
              className={cn(
                "rounded-sm text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
                link.active
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className="grid size-9 place-items-center rounded-full bg-navy text-sm font-semibold text-lime focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:bg-indigo-soft dark:text-navy"
        >
          {name.charAt(0).toUpperCase()}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {links.map((link) => (
            <DropdownMenuItem
              key={link.label}
              className="md:hidden"
              render={
                <Link
                  href={link.href}
                  transitionTypes={["ledger-budget"]}
                  aria-current={link.active ? "page" : undefined}
                />
              }
            >
              {link.label}
            </DropdownMenuItem>
          ))}
          {links.length > 0 && <DropdownMenuSeparator className="md:hidden" />}
          <DropdownMenuItem onClick={signOut} disabled={pending}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
