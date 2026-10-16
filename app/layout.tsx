import { ClerkProvider } from "@clerk/nextjs";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { type ReactNode } from "react";
import { Toaster } from "sonner";

import Footer from "@/components/footer";
import Header from "@/components/header";
import { ThemeProviderWrapper } from "@/components/theme-provider";
import "./globals.css";

// Display and UI share one grotesque; every figure the product prints —
// balances, amounts, percentages — goes through the mono so columns of money
// align on the decimal. Exposed as CSS variables, never as a className.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata = {
  title: "TrackXpense",
  description: "All in one expense tracker",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      >
        <body className="min-h-screen bg-background text-foreground antialiased">
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
    </ClerkProvider>
  );
}
