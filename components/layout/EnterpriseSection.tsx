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
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Enterprise Solutions
              </span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl">
              Upskill your entire team with our corporate packages. Get bulk pricing, custom learning paths, and dedicated support.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {enterpriseFeatures.map((feature, index) => (
                <motion.div 
                  key={index}
                  className="bg-card backdrop-blur-sm rounded-lg p-4 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
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
            <div className="bg-card rounded-xl shadow-lg p-8 border">
              <h3 className="text-2xl font-bold mb-6 text-center">Get Started</h3>
              
              <div className="space-y-4">
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-primary-foreground shadow-lg border-0"
                  size="lg"
                  asChild
                >
                  <a href="/enterprise/demo">Request Enterprise Demo</a>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
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