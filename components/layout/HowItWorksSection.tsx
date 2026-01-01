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
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            How It Works
          </span>
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Start your learning journey in just a few simple steps
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
          >
            <div className="text-4xl mb-4">{step.icon}</div>
            <div className="text-2xl font-bold text-primary mb-2">0{step.id}</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{step.title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}