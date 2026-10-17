import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { type ReactNode } from "react";
import { Toaster } from "sonner";

import Footer from "@/components/footer";
import Header from "@/components/header";
import { ThemeProviderWrapper } from "@/components/theme-provider";
import "./globals.css";

// Type pairs HarmonyOS Sans (where installed — the family many of our readers
// already have) with Geist as the everywhere-else sans, and every figure the
// product prints — balances, amounts, percentages — goes through Geist Mono so
// columns of money align on the decimal. Self-hosted via the `geist` package,
// no runtime font fetch. Exposed as CSS variables, never as a className.
export const metadata = {
  title: "TrackXpense",
  description: "All in one expense tracker",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      // The router reads this to keep `scroll-smooth` (globals.css) without
      // logging "Detected scroll-behavior: smooth" on every navigation.
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div aria-hidden className="app-aurora">
          <span className="blob blob-1" />
          <span className="blob blob-2" />
          <span className="blob blob-3" />
        </div>
        <ThemeProviderWrapper>
          {/* Header owns its own Suspense boundary: the bar paints immediately
              and only the auth-aware slot waits on the database. */}
          <Header />
          <main className="flex min-h-[calc(100vh-9rem)] w-full flex-col">{children}</main>
          <Toaster richColors />
          <Footer />
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
