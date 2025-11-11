"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

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
    <section className="container mx-auto px-4 py-16">
      <div className="bg-gradient-to-br from-[#FF6B35]/10 to-[#FF914D]/10 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              <span className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D] bg-clip-text text-transparent">
                Enterprise Solutions
              </span>
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg mb-8 max-w-2xl">
              Upskill your entire team with our corporate packages. Get bulk pricing, custom learning paths, and dedicated support.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {enterpriseFeatures.map((feature, index) => (
                <motion.div 
                  key={index}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            className="flex-1 w-full"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Get Started</h3>
              
              <div className="space-y-4">
                <Button 
                  className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF914D] hover:from-[#FF844B] hover:to-[#FFB088] text-white shadow-lg"
                  size="lg"
                  asChild
                >
                  <a href="/enterprise/demo">Request Enterprise Demo</a>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full border-2 border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white"
                  size="lg"
                  asChild
                >
                  <a href="/enterprise/brochure">Download Brochure</a>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}