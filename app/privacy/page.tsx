import type { Metadata } from "next";

import { socialCard } from "@/lib/social-card";

/** Its own card, not the landing page's: a shared legal link should say which
 *  document it is. `socialCard` fills `og:*`, `twitter:*`, `og:url` and the
 *  canonical from this one title. */
export const metadata: Metadata = socialCard({
  title: "Privacy Policy",
  description: "Privacy Policy for trackXpense.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: October 24, 2026</p>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <p>
          We collect the information you provide when you create an account (name, email, password)
          and the financial data you enter (accounts, transactions, budgets, categories). We also
          collect basic usage data needed to operate the Service.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
        <p>
          Your data is used solely to provide and improve the Service: storing your ledger,
          computing analytics, sending transactional emails (e.g. reports), and maintaining your
          account.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">3. Data Storage & Security</h2>
        <p>
          Data is stored in a managed Postgres database (Neon) with encryption in transit and at
          rest. Passwords are hashed by Better Auth. We take reasonable measures to protect your
          data but cannot guarantee absolute security.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">4. Data Sharing</h2>
        <p>
          We do not sell your personal data. Data may be shared only with service providers
          necessary to operate the app (hosting, database, email delivery, file storage) under
          confidentiality obligations, or when required by law.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">5. Receipts & File Storage</h2>
        <p>
          Uploaded receipts are stored in object storage (S3-compatible). You can delete them at any
          time; deletion removes the file and its reference.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">6. Cookies & Sessions</h2>
        <p>
          We use session cookies to keep you signed in. These are essential for the Service to
          function and are not used for advertising.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">7. Your Rights</h2>
        <p>
          You can access, correct, or delete your data at any time from within the app, including
          deleting your account. Contact us for any data-related requests.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">8. Data Retention</h2>
        <p>
          We retain your data for as long as your account exists. Upon deletion, your data is
          removed from the Service.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">9. Children</h2>
        <p>
          The Service is not intended for children under 13. We do not knowingly collect data from
          children.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">10. Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. Continued use of the Service after changes
          constitutes acceptance of the updated policy.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">11. Contact</h2>
        <p>Questions about this policy? Contact us via the project repository.</p>
      </section>
    </main>
  );
}
