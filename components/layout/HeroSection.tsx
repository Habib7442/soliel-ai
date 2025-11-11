"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left side - Text content */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D] bg-clip-text text-transparent">
              Master AI & Technology
            </span>
            <br />
            <span className="text-gray-800 dark:text-white">
              with Interactive Hands-On Learning
            </span>
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0">
            Join thousands of learners in our cutting-edge platform designed to help you master the latest technologies through practical, real-world projects and expert guidance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button asChild size="lg" className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D] hover:from-[#FF844B] hover:to-[#FFB088] text-white shadow-lg">
              <Link href="/courses">
                Explore Courses
              </Link>
            </Button>
            
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Right side - Image */}
        <div className="flex-1 w-full">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src="/images/hero.png"
              alt="Learning Platform"
              width={600}
              height={400}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}