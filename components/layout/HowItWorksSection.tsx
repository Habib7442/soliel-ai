"use client";

import { motion } from "framer-motion";

const steps = [
  {
    id: 1,
    title: "Browse",
    description: "Explore our extensive library of courses and find the perfect match for your learning goals.",
    icon: "🔍"
  },
  {
    id: 2,
    title: "Enroll",
    description: "Purchase courses or bundles and get instant access to all learning materials and resources.",
    icon: "🎓"
  },
  {
    id: 3,
    title: "Learn",
    description: "Engage with interactive content, videos, quizzes, and hands-on projects at your own pace.",
    icon: "💻"
  },
  {
    id: 4,
    title: "Get Certified",
    description: "Earn certificates and badges to showcase your new skills and advance your career.",
    icon: "🏆"
  }
];

export function HowItWorksSection() {
  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gray-50/50">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white to-transparent" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <motion.h2 
            className="text-4xl md:text-5xl font-black tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Your Journey to <span className="text-primary italic">Success</span>
          </motion.h2>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            We've simplified the learning process so you can focus on what matters most: growing your skills.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative">
          {/* Connector Line (hidden on mobile) */}
          <div className="hidden md:block absolute top-[40%] left-0 w-full h-0.5 bg-gray-100 -z-10" />

          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              className="relative group h-full"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              {/* Step Number Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border border-gray-100 shadow-md flex items-center justify-center z-20 transition-transform group-hover:scale-110">
                <span className="text-[10px] font-black text-primary">0{step.id}</span>
              </div>

              <div className="h-full pt-8 pb-6 px-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-center flex flex-col items-center hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-2xl mb-4 group-hover:bg-primary/10 transition-colors duration-300">
                  {step.icon}
                </div>
                
                <h3 className="text-base font-bold mb-2 text-gray-900 leading-tight">
                  {step.title}
                </h3>
                
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Arrow for mobile/tablet (between cards) */}
              {index < steps.length - 1 && (
                <div className="lg:hidden flex justify-center mt-6 text-gray-300">
                  <svg className="w-8 h-8 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}