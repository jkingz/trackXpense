import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";

const groups = [
  {
    title: "Ledger",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Add a transaction", href: "/transaction/create" },
      { label: "Accounts", href: "/dashboard" },
    ],
  },
  {
    title: "The product",
    links: [
      { label: "What's inside", href: "/#inside" },
      { label: "How it works", href: "/#flow" },
      { label: "Categories", href: "/#categories" },
    ],
  },
  {
    title: "Start here",
    links: [
      { label: "Open your ledger", href: "/dashboard" },
      { label: "Log an entry", href: "/transaction/create" },
    ],
  },
];

function Footer() {
  return (
    <footer className="relative overflow-hidden border-t bg-background">
      <div className="container mx-auto grid grid-cols-2 gap-x-8 gap-y-12 px-4 py-16 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-2">
          <Link href="/" className="flex items-center gap-2.5" aria-label="TrackXpense home">
            <Logo className="size-7 text-brand-deep" />
            <span className="text-base font-bold tracking-tight">TrackXpense</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            A two-account ledger you fill in yourself. No bank to connect, no statement to import —
            just the entry you made this morning and what it did to the balance.
          </p>
          <Link
            href="/transaction/create"
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand-deep transition-colors hover:text-foreground"
          >
            Log something
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-semibold text-foreground">{group.title}</h2>
            <ul className="mt-4 space-y-3">
              {group.links.map((link) => (
                <li key={`${group.title}-${link.label}`}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t">
        <div className="container mx-auto flex flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; TrackXpense. Your entries stay yours.</p>
          <p className="font-mono">Built for people who'd rather type it than track it.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
