"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  features: string[];
  popular?: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    id: "ai-fundamentals",
    name: "AI Fundamentals Bundle",
    description: "Perfect for beginners looking to start their AI journey",
    price: 197,
    originalPrice: 297,
    features: [
      "Introduction to AI",
      "Machine Learning Basics",
      "Python for AI",
      "3 comprehensive courses",
      "15+ hours of content",
      "Hands-on projects",
      "Certificate of completion"
    ],
    popular: false
  },
  {
    id: "data-science-pro",
    name: "Data Science Pro Bundle",
    description: "Advanced courses for data science professionals",
    price: 297,
    originalPrice: 496,
    features: [
      "Data Analysis",
      "Advanced ML",
      "Deep Learning",
      "AI Ethics",
      "4 advanced courses",
      "25+ hours of content",
      "Real-world datasets",
      "Industry mentor access"
    ],
    popular: true
  },
  {
    id: "full-stack-ai",
    name: "Full Stack AI Bundle",
    description: "Complete package for AI engineers and developers",
    price: 397,
    originalPrice: 695,
    features: [
      "AI Fundamentals",
      "MLOps",
      "AI Product",
      "Computer Vision",
      "NLP",
      "5 complete courses",
      "40+ hours of content",
      "Portfolio projects",
      "Job placement assistance"
    ],
    popular: false
  }
];

export function PricingSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            Investment Plans
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 tracking-tighter text-gray-900 leading-tight">
            Elevate your <span className="text-primary italic">potential.</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto font-medium leading-relaxed">
            Choose a plan that fits your ambition. Save more with our curated course bundles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              className={`group relative bg-white/70 backdrop-blur-xl rounded-[3rem] p-10 flex flex-col transition-all duration-500 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] ${
                plan.popular ? "ring-2 ring-primary shadow-2xl shadow-primary/10 scale-105 z-20" : "scale-100 hover:scale-[1.02]"
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-lg shadow-primary/25">
                  Most Preferred
                </div>
              )}
              
              <div className="mb-10">
                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight group-hover:text-primary transition-colors">{plan.name}</h3>
                <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed mb-8">{plan.description}</p>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">$</span>
                  <span className="text-6xl font-black text-gray-900 tracking-tighter tabular-nums">{plan.price}</span>
                  {plan.originalPrice && (
                    <span className="text-xl text-muted-foreground/40 line-through tabular-nums">${plan.originalPrice}</span>
                  )}
                </div>
                {plan.originalPrice && (
                  <div className="mt-4 inline-block px-3 py-1 rounded-lg bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest">
                    Save {(100 - (plan.price / plan.originalPrice * 100)).toFixed(0)}% Today
                  </div>
                )}
              </div>
              
              <ul className="space-y-4 mb-12 flex-1">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                      <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-gray-600 leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                size="xl"
                className={`w-full rounded-2xl h-16 text-base font-black tracking-tight transition-all active:scale-95 ${
                  plan.popular 
                    ? "bg-primary hover:bg-primary/95 text-white shadow-xl shadow-primary/20" 
                    : "bg-black hover:bg-gray-900 text-white shadow-xl shadow-black/10"
                }`}
              >
                Access Bundle
              </Button>
            </motion.div>
          ))}
        </div>
        
        <div className="bg-gray-900 rounded-[3rem] p-12 md:p-20 relative overflow-hidden text-center max-w-5xl mx-auto shadow-2xl">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,0,0,0.15),transparent_60%)]" />
          
          <div className="relative z-10">
            <h3 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight">Looking for <span className="text-primary italic">Custom Scale?</span></h3>
            <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
              We offer bespoke solutions for enterprises, government bodies, and educational institutions looking to empower their teams.
            </p>
            <Button 
              size="xl"
              className="bg-white hover:bg-gray-100 text-gray-900 rounded-2xl h-16 px-12 text-base font-black tracking-tight shadow-xl transition-all active:scale-95 group border-0"
              asChild
            >
              <a href="/contact" className="flex items-center gap-3">
                Contact Enterprise Sales
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
