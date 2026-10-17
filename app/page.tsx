import ClosingCta from "@/components/landing/closing-cta";
import CategoriesBand from "@/components/landing/categories-band";
import FeatureBento from "@/components/landing/feature-bento";
import MetricsBand from "@/components/landing/metrics-band";
import HeroSection from "@/components/hero";
import LandingFlow from "@/components/landing-flow";
import type { Metadata } from "next";
import { featuresData } from "@/data/landing";
import { site } from "@/lib/site";

/** Home-page canonical. Declared here, not in the root layout: a canonical in
 *  the layout is inherited by every route, which would point /dashboard,
 *  /transaction and /account back at this page. `metadataBase` from the layout
 *  is what turns this root-relative path into an absolute URL. */
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

/**
 * schema.org JSON-LD for the marketing page. This is the part an AI answer
 * engine reads when it summarises what the product is: without it, a model has
 * only the og:description to go on.
 *
 * Two entities, not one: `WebSite` names the host, `SoftwareApplication`
 * describes the product. `featureList` is read from `featuresData` so the JSON-LD
 * cannot drift from the feature titles rendered below it. `public/llms.txt` is a
 * separate hand-written copy and is not kept in sync automatically.
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
      featureList: featuresData.map((feature) => feature.title),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ],
};

export default function Home() {
  return (
    // max-w-full + the html-level overflow-x-hidden keep the scroll-linked
    // transforms from ever widening the page.
    <div className="w-full max-w-full">
      <script
        type="application/ld+json"
        // Serialised once at build time from module constants — no user input
        // reaches this string, so the JSON cannot break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <HeroSection />

      <MetricsBand className="mt-6 md:mt-10" />

      <div className="--mesh-veil">
        <FeatureBento />
        <CategoriesBand />
      </div>

      <LandingFlow />

      <ClosingCta />
    </div>
  );
}
