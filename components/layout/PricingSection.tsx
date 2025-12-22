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
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <Badge className="mb-4 bg-gradient-to-r from-[#FF6B35] to-[#FF914D] text-white">
          Limited Time Offer
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D] bg-clip-text text-transparent">
            Course Bundles & Corporate Plans
          </span>
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Save big with our curated course bundles or get enterprise solutions for your team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {pricingPlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col ${
              plan.popular ? "ring-2 ring-[#FF6B35] relative" : ""
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            {plan.popular && (
              <div className="bg-[#FF6B35] text-white text-center py-2">
                <span className="font-bold">Most Popular</span>
              </div>
            )}
            
            <div className="p-8 flex flex-col flex-1">
              <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{plan.name}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{plan.description}</p>
              
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                  {plan.originalPrice && (
                    <span className="ml-2 text-xl text-gray-500 line-through">${plan.originalPrice}</span>
                  )}
                </div>
                {plan.originalPrice && (
                  <div className="mt-2 text-[#FF6B35] font-medium">
                    Save ${plan.originalPrice - plan.price}
                  </div>
                )}
              </div>
              
              <ul className="mb-8 space-y-3 flex-1">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <span className="text-[#FF6B35] mr-2">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full mt-auto ${
                  plan.popular 
                    ? "bg-gradient-to-r from-[#FF6B35] to-[#FF914D] hover:from-[#FF844B] hover:to-[#FFB088] text-white" 
                    : "border-2 border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white"
                }`}
                size="lg"
              >
                Get Bundle
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="text-center mt-16">
        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Need a Custom Solution?</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
          Contact us for enterprise licensing, team training, or custom course development.
        </p>
        <Button 
          className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D] hover:from-[#FF844B] hover:to-[#FFB088] text-white shadow-lg"
          size="lg"
          asChild
        >
          <a href="/contact">Contact Sales</a>
        </Button>
      </div>
    </section>
  );
}