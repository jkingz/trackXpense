'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

const HeroSection = () => {
  const imageRef = useRef();

  useEffect(() => {
    const imgElement = imageRef.current;
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;

      if (scrollPosition > scrollThreshold) {
        imgElement.classList.add('scrolled');
      } else {
        imgElement.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  return (
    <div className="pb-20 px-4">
      <div className="container mx-auto text-center">
        <h1 className="--gradient-title text-5xl md:text-8xl lg:text-[105px] pb-6">
          Manage your Finances <br /> with AI
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          An AI-powered financial platform, helps you track and manage your
          financial habbits, set budgets, and make informed financial
        </p>
        <div>
          <Link href="/dashboard">
            <Button size="lg" className="px-8">
              Get started
            </Button>
          </Link>
        </div>
      </div>
      <div className="--hero-image-wrapper">
        <div ref={imageRef} className="--hero-image">
          <Image
            src="/AI.jpg"
            alt="banner"
            width={1280}
            height={720}
            priority
            className="rounded-lg shadow-2xl border mx-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
