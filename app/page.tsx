import ClosingCta from "@/components/landing/closing-cta";
import { LandingMotion } from "@/components/landing/landing-motion";
import HeroSection from "@/components/hero";
import LandingFlow from "@/components/landing-flow";
import type { Metadata } from "next";
import { featureTitles } from "@/data/landing";
import { defaultCurrency } from "@/lib/money";
import { site } from "@/lib/site";
import { socialCard } from "@/lib/social-card";

/** Home-page card. Authored here rather than inherited from the root layout
 *  because this is the one public route whose card should be written down rather
 *  than defaulted, and `socialCard` fills title, og:*, twitter:* and canonical
 *  from one argument. `metadataBase` in the layout turns `path` into an absolute
 *  URL.
 *
 *  Inheriting the layout's title would render the same string — `title.template`
 *  does not apply to a page in the same segment — but it would leave this page
 *  with no `og:url` of its own until increments 3 and 4 stop the auth routes and
 *  the 404 sharing the layout's values. */
export const metadata: Metadata = socialCard({
  title: site.title,
  path: "/",
});

/**
 * schema.org JSON-LD for the marketing page. This is the part an AI answer
 * engine reads when it summarises what the product is: without it, a model has
 * only the og:description to go on.
 *
 * Two entities, not one: `WebSite` names the host, `SoftwareApplication`
 * describes the product. `public/llms.txt` provides the longer feature descriptions.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      description: site.description,
      inLanguage: "en-US",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${site.url}/#app`,
      name: site.name,
      description: site.description,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Any",
      url: site.url,
      featureList: featureTitles,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: defaultCurrency,
      },
    },
  ],
};

export default function Home() {
  return (
    <div className="pocket-log w-full bg-background">
      <script
        type="application/ld+json"
        // Serialised once at build time from module constants — no user input
        // reaches this string, so the JSON cannot break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <LandingMotion>
        <HeroSection />
        <LandingFlow />
      </LandingMotion>

      <ClosingCta />
    </div>
  );
}
