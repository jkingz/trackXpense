import HeroSection from '@/components/hero';
import { statsData } from '@/data/landing';

export default function Home() {
  return (
    <div className="mt-40">
      <HeroSection />
      <section className="py-20 bg-sky-100">
        <div className="container mx-auto text-center px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {statsData.map((stat) => (
            <div key={stat.label} className="flex items-center space-x-4">
              <div className="text-4xl font-bold">{stat.value}</div>
              <div>{stat.label}</div>
            </div>
          ))}
          </div>
        </div>
        <div>
        </div>
      </section>
    </div>
  );
}
