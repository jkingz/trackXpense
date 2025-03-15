import HeroSection from '@/components/hero';
import { featuresData, howItWorksData, statsData } from '@/data/landing';
import { Card, CardContent } from '@/components/ui/card';
export default function Home() {
  return (
    <div className="mt-40">
      <HeroSection />
      {/* // Stats Section */}
      <section className="py-20 bg-sky-100">
        <div className="container mx-auto text-center px-4">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 text-[12px] md:text-2xl font-bold md:font-normal">
            {statsData.map((stat, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div></div>
      </section>
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
      <section className="py-16 bg-white">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            {howItWorksData.map((feature, index) => (
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
    </div>
  );
}
