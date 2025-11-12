"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    title: "Powerful Platform Architecture",
    description: "Built on modern microservices architecture with Next.js frontend and Supabase backend for scalable performance.",
    icon: "🏗️",
    tech: "Next.js + Supabase"
  },
  {
    title: "Secure Authentication",
    description: "Enterprise-grade security with JWT tokens and OAuth2 integration using Supabase Auth for safe learning.",
    icon: "🔒",
    tech: "Supabase Auth"
  },
  {
    title: "Interactive Learning",
    description: "Hands-on coding environments with video lessons, quizzes, and assignments for practical learning.",
    icon: "💻",
    tech: "Lesson Player"
  },
  {
    title: "Progress Tracking",
    description: "Real-time analytics and progress monitoring to optimize your learning journey with completion certificates.",
    icon: "📊",
    tech: "Analytics Dashboard"
  },
  {
    title: "Smart Assessments",
    description: "AI-powered quiz system with automated grading and personalized feedback for better learning outcomes.",
    icon: "🤖",
    tech: "Quiz Engine"
  },
  {
    title: "Secure Payments",
    description: "Secure payment processing with Stripe integration for course purchases and subscriptions.",
    icon: "💳",
    tech: "Stripe Payments"
  },
  {
    title: "Course Management",
    description: "Comprehensive tools for instructors to create, publish, and manage courses with lesson content.",
    icon: "⚙️",
    tech: "Instructor Portal"
  },
  {
    title: "Enterprise-Ready Infrastructure",
    description: "Robust infrastructure designed for scalability, reliability, and multi-tenant B2B support.",
    icon: "🏢",
    tech: "Cloud Native"
  }
];

const techStack = [
  "Next.js 16 (App Router)",
  "React 19",
  "TypeScript",
  "Tailwind CSS",
  "shadcn/ui",
  "Supabase (Postgres)",
  "Supabase Auth",
  "Stripe (Payments)"
];

export function FeaturesSection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D] bg-clip-text text-transparent">
            Powerful Features
          </span>
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Our platform combines cutting-edge technology with intuitive design to deliver the best learning experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <div className="text-5xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{feature.description}</p>
            <Badge variant="secondary">{feature.tech}</Badge>
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <h3 className="text-2xl font-bold mb-8">Technology Stack</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {techStack.map((tech, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-md"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <span className="text-sm font-medium">{tech}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}