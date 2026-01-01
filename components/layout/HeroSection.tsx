"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 pt-4 pb-8">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left side - Text content */}
        <motion.div 
          className="flex-1 text-center lg:text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Master AI & Technology
            </span>
            <br />
            <span className="text-foreground">
              with Interactive Hands-On Learning
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Join thousands of learners in our cutting-edge platform designed to help you master the latest technologies through practical, real-world projects and expert guidance.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-primary-foreground shadow-lg border-0">
              <Link href="/courses">
                Explore Courses
              </Link>
            </Button>
            
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">
                Sign In
              </Link>
            </Button>
          </motion.div>
        </motion.div>
        
        {/* Right side - Image */}
        <motion.div 
          className="flex-1 w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
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
        </motion.div>
      </div>
    </section>
  );
}