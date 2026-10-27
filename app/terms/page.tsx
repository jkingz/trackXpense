import type { Metadata } from "next";

import { socialCard } from "@/lib/social-card";

/** Its own card, not the landing page's: a shared legal link should say which
 *  document it is. `socialCard` fills `og:*`, `twitter:*`, `og:url` and the
 *  canonical from this one title. */
export const metadata: Metadata = socialCard({
  title: "Terms & Conditions",
  description: "Terms and Conditions for using trackXpense.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Terms & Conditions</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: October 24, 2026</p>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
        <p>
          By creating an account or using trackXpense ("the Service"), you agree to be bound by
          these Terms & Conditions. If you do not agree, do not use the Service.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">2. Description of Service</h2>
        <p>
          trackXpense is a personal finance tracking application that lets you record accounts,
          transactions, budgets, and recurring expenses, and view analytics about your spending. The
          Service is provided "as is" and may change over time.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">3. User Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and
          for all activity under your account. You must provide accurate information when
          registering and keep it up to date.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">4. User Content & Data</h2>
        <p>
          You retain ownership of the financial data you enter. By using the Service you grant us a
          limited license to store, process, and display that data solely to provide the Service to
          you. You are responsible for the accuracy of your data.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
        <p>
          You agree not to misuse the Service, including attempting to access other users' data,
          disrupting the Service, or using it for any unlawful purpose.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">6. Disclaimer of Warranties</h2>
        <p>
          The Service is provided "as is" without warranties of any kind. trackXpense is not a
          financial advisor and does not provide financial, tax, or investment advice. Always
          consult a qualified professional for such guidance.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, trackXpense and its operators shall not be liable
          for any indirect, incidental, or consequential damages arising from your use of the
          Service.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">8. Termination</h2>
        <p>
          We may suspend or terminate your account if you violate these terms. You may delete your
          account at any time, which will remove your data from the Service.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">9. Changes to Terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the Service after changes
          constitutes acceptance of the new terms.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">10. Contact</h2>
        <p>Questions about these terms? Contact us via the project repository.</p>
      </section>
    </main>
  );
}
