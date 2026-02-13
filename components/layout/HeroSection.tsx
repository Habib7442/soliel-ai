"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useSupabase } from "@/providers/supabase-provider";
import { UserRole } from "@/types/enums";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

export function HeroSection() {
  const { user } = useSupabase();
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role as UserRole);
        }
      }
    };
    fetchUserRole();
  }, [user]);

  const getDashboardLink = () => {
    switch (userRole) {
      case UserRole.INSTRUCTOR: return "/instructor-dashboard";
      case UserRole.COMPANY_ADMIN: return "/company-dashboard";
      case UserRole.SUPER_ADMIN: return "/admin-dashboard";
      default: return "/student-dashboard";
    }
  };

  const ctaLink = user ? getDashboardLink() : "/sign-up";
  const ctaText = user ? "Go to Dashboard" : "Get Started Now";

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-32 px-4 sm:px-6 lg:px-8 selection:bg-primary selection:text-white">
      {/* Abstract Background Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto">
        {/* Social Proof Badge - Moved above the split to allow H1 and Image to align perfectly */}
        <div className="flex justify-center lg:justify-start">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 mb-8 z-10"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                  <Image 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} 
                    alt="User avatar" 
                    width={24} 
                    height={24} 
                  />
                </div>
              ))}
            </div>
            <span className="text-sm font-medium text-primary">Trusted by 10k+ learners</span>
            <div className="flex items-center ml-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className="w-3 h-3 text-yellow-500 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-16 lg:gap-24">
          <motion.div 
            className="flex-1 text-center lg:text-left z-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.2] mb-8 lg:max-w-[20ch]">
              Master <span className="text-primary italic">AI</span> & Technology with <br />
              <span className="relative">
                Interactive Learning
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/20 fill-current" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 25 0, 50 5 T 100 5 L 100 10 L 0 10 Z" />
                </svg>
              </span>
            </h1>

            <p className="text-xl text-muted-foreground/80 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Step into the future with Soliel AI Academy. We bridge the gap between theory and practice with immersive courses designed for the next generation of tech leaders.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
              <Button asChild size="xl" className="rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-10 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 border-0">
                <Link href={ctaLink}>
                  {ctaText}
                </Link>
              </Button>
            </div>
          </motion.div>

          <motion.div 
            className="flex-1 w-full relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative group">
              {/* Decorative rings */}
              <div className="absolute -top-10 -right-10 w-32 h-32 border-4 border-primary/10 rounded-full animate-pulse" />
              <div className="absolute -bottom-10 -left-10 w-24 h-24 border-4 border-primary/5 rounded-full" />
              
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border-8 border-white bg-white group-hover:shadow-[0_48px_80px_-20px_rgba(0,0,0,0.15)] transition-all duration-500">
                <Image
                  src="/images/hero.png"
                  alt="Students learning together"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover transform transition duration-700 group-hover:scale-105"
                  priority
                />
              </div>

              {/* Stats Cards overlay */}
              <motion.div 
                className="absolute -bottom-6 -right-6 lg:-right-12 bg-white p-5 rounded-3xl shadow-2xl border border-gray-100 z-20 hidden md:block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Placement Rate</p>
                    <p className="text-2xl font-black text-gray-900 leading-none">94.8%</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}