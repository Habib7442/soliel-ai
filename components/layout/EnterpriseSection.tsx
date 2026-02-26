"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Image from "next/image";

const enterpriseFeatures = [
  {
    title: "Bulk Pricing",
    description: "Special discounts for 10+ seats"
  },
  {
    title: "Progress Tracking",
    description: "Monitor team learning progress"
  },
  {
    title: "Team Analytics",
    description: "Detailed insights and reporting"
  },
  {
    title: "Custom Training",
    description: "Tailored content for your needs"
  }
];

export function EnterpriseSection() {
  return (
    <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
      {/* Background Blobs for context */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] overflow-hidden bg-gray-900 px-6 py-10 sm:px-10 sm:py-12 md:px-16 md:py-16 lg:px-20 lg:py-20 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
          {/* Animated Background Gradients inside the dark card */}
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,0,0,0.25),transparent_60%)]" />
          <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(255,0,0,0.1),transparent_50%)]" />
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 sm:gap-16 lg:gap-20 relative z-10">
            <motion.div 
              className="flex-1 text-left w-full"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block px-3 sm:px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary-foreground text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-6 sm:mb-8">
                Enterprise Solutions
              </div>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] mb-6 sm:mb-8 md:mb-10 tracking-tighter">
                Scale your <br />
                <span className="text-primary italic">workforce</span> IQ.
              </h2>
              
              <p className="text-gray-400 text-base sm:text-lg md:text-xl mb-8 sm:mb-10 md:mb-12 max-w-xl leading-relaxed font-medium">
                Transform your organization with tailored learning paths, deep intelligence, and world-class support.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 sm:gap-x-12 gap-y-6 sm:gap-y-8">
                {enterpriseFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 sm:gap-4 group">
                    <div className="mt-1 w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/40 group-hover:rotate-12 transition-all duration-300">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-white text-base sm:text-lg font-black tracking-tight mb-1">{feature.title}</h4>
                      <p className="text-gray-500 text-xs sm:text-sm font-medium leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              className="w-full lg:w-[480px] lg:flex-shrink-0"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="backdrop-blur-3xl bg-white/5 border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] p-6 sm:p-8 md:p-10 lg:p-12 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] group-hover:bg-primary/20 transition-all duration-1000" />
                
                <div className="text-center mb-8 sm:mb-10 md:mb-12">
                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 sm:mb-3 tracking-tight">Ready to scale?</h3>
                  <p className="text-gray-400 font-medium tracking-wide uppercase text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em]">Unlock corporate excellence today.</p>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <Button size="xl" className="w-full rounded-xl sm:rounded-2xl bg-primary hover:bg-primary/95 text-white font-black tracking-tight shadow-2xl shadow-primary/30 group/btn transition-all active:scale-95 border-0 h-14 sm:h-16 text-sm sm:text-base">
                    Request Private Demo
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3 transition-transform group-hover/btn:translate-x-2" />
                  </Button>
                  
                  <Button variant="outline" size="xl" className="w-full rounded-xl sm:rounded-2xl bg-transparent border-white/10 text-white hover:bg-white hover:text-gray-900 font-black tracking-tight transition-all active:scale-95 h-14 sm:h-16 text-sm sm:text-base">
                    Download Enterprise Deck
                  </Button>
                </div>
                
                <div className="mt-8 sm:mt-10 md:mt-12 pt-8 sm:pt-10 border-t border-white/10 flex flex-col items-center gap-4 sm:gap-6">
                  <div className="flex -space-x-3 sm:-space-x-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-gray-900 bg-gray-800 overflow-hidden shadow-xl">
                        <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=enterprise-${i}`} alt="Partner" width={48} height={48} />
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] text-center">Trusted by 500+ Global Teams</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
