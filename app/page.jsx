import HeroSection from '@/components/hero';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { featuresData, howItWorksData } from '@/data/landing';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="mt-40">
      <HeroSection />
      {/* // Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to manage your finances
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            {featuresData.map((feature, index) => (
              <Card key={index} className="p-6">
                <CardContent className="space-y-4 pt-4">
                  <div className="flex  justify-center">{feature.icon}</div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* How It Works Section */}
      <section className="py-16 bg-sky-50">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksData.map((step, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center items-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="container text-center mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            Take control of your finances
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto text-center mb-8">
            Record an expense in seconds, keep every receipt, and see where your
            money actually went with TrackXpense
          </p>
          <Link href="/sign-up">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
