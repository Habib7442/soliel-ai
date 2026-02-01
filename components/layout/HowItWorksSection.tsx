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
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gray-50/50">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white to-transparent" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
          {/* Connector Line (hidden on mobile) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-12 -z-10" />

          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              className="relative group"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              {/* Step Number Badge */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-xl flex items-center justify-center z-20 transition-transform group-hover:scale-110 group-hover:rotate-6">
                <span className="text-xl font-black text-primary">0{step.id}</span>
              </div>

              <div className="h-full pt-12 pb-10 px-8 bg-white rounded-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100 text-center flex flex-col items-center hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 group-hover:-translate-y-2">
                <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center text-5xl mb-8 group-hover:bg-primary/10 transition-colors duration-500">
                  {step.icon}
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-gray-900 leading-tight tracking-tight">
                  {step.title}
                </h3>
                
                <p className="text-muted-foreground/90 font-medium leading-relaxed">
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