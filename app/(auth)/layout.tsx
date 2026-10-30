import type { Metadata } from "next";
import React from "react";

import { AuthPanel } from "@/components/auth/auth-panel";
import { site } from "@/lib/site";

/**
 * Auth routes are not part of the public link graph: an indexed `/sign-in` is a
 * duplicate of the landing page, and a shared auth URL should not unfurl with
 * the product pitch. `robots` turns indexing off; `openGraph` and `twitter` are
 * restated wholesale because a child that sets either replaces the root
 * layout's block rather than merging into it, and only the override drops the
 * landing headline. `summary` (not `summary_large_image`) because this block
 * carries no image — a large-image card with none is a card a platform cannot
 * render, and attaching the product art would put the pitch back on an auth URL.
 *
 * One title covers the whole segment — the pages under it are `"use client"`
 * and cannot export `metadata`. `title.absolute` skips the root
 * `title.template`, which would otherwise render `TrackXpense — TrackXpense`.
 */
export const metadata: Metadata = {
  title: { absolute: site.name },
  robots: { index: false },
  openGraph: {
    type: "website",
    locale: site.locale,
    siteName: site.name,
    title: site.name,
    description: site.description,
  },
  twitter: {
    card: "summary",
    title: site.name,
    description: site.description,
  },
};

/**
 * Every auth route gets the same split: pitch on the left, form on the right.
 * The grid lives here so sign-in and sign-up cannot drift. Below `lg` the form
 * comes first — a phone visitor should not scroll past the whole pitch to reach
 * the fields.
 */
const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid flex-1 items-stretch lg:grid-cols-2">
      <AuthPanel />
      <div className="order-1 flex items-center justify-center px-4 py-14 lg:order-2 lg:py-20">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;
