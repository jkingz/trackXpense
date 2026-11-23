"use client";

import { BookOpen, PiggyBank, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Bottom tabs for the ledger routes below `lg`, where the desktop nav and rail are hidden.
 * Lives outside the header: its backdrop-filter would pin `fixed` children to the header.
 */
export function MobileTabBar({ ledgerHref }: { ledgerHref: string | null }) {
  const pathname = usePathname();

  const tabs = [
    ...(ledgerHref
      ? [
          {
            label: "Ledger",
            href: ledgerHref,
            icon: BookOpen,
            active: pathname.startsWith("/account/"),
          },
        ]
      : []),
    {
      label: "Add",
      href: "/transaction/create",
      icon: Plus,
      active: pathname.startsWith("/transaction/"),
    },
    {
      label: "Budget",
      href: "/dashboard#budget",
      icon: PiggyBank,
      active: pathname === "/dashboard",
    },
  ];

  return (
    <nav
      aria-label="App"
      data-tab-bar
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {tabs.map(({ label, href, icon: Icon, active }) => (
          <li key={label} className="flex-1">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 text-xs focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                active ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full",
                  label === "Add" && "bg-primary text-primary-foreground",
                )}
              >
                <Icon aria-hidden className={label === "Add" ? "size-4" : "size-5"} />
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
