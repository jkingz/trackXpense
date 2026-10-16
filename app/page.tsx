import ClosingCta from "@/components/landing/closing-cta";
import CategoriesBand from "@/components/landing/categories-band";
import FeatureBento from "@/components/landing/feature-bento";
import MetricsBand from "@/components/landing/metrics-band";
import HeroSection from "@/components/hero";
import LandingFlow from "@/components/landing-flow";

export default function Home() {
  return (
    // max-w-full + the html-level overflow-x-hidden keep the scroll-linked
    // transforms from ever widening the page.
    <div className="w-full max-w-full">
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
