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
    description: "Enterprise-grade security with JWT tokens and OAuth2 integration using Clerk for safe learning.",
    icon: "🔒",
    tech: "Clerk Auth"
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
  "Clerk (Auth)",
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
            whileHover={{ y: -5 }}
          >
            <div className="text-3xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{feature.description}</p>
            <Badge variant="secondary" className="bg-[#FF6B35]/10 text-[#FF6B35] dark:bg-[#FF914D]/20 dark:text-[#FF914D]">
              {feature.tech}
            </Badge>
          </motion.div>
        ))}
      </div>

      <motion.div 
        className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D] rounded-2xl p-8 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <h3 className="text-2xl font-bold mb-4 text-white">Enterprise-Ready Infrastructure</h3>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {techStack.map((tech, index) => (
            <Badge 
              key={index} 
              className="bg-white/20 text-white hover:bg-white/30"
            >
              {tech}
            </Badge>
          ))}
        </div>
        <p className="text-white/90 max-w-2xl mx-auto">
          Our robust infrastructure ensures 99.9% uptime, scalable performance, and enterprise-grade security for all your learning needs.
        </p>
      </motion.div>
    </section>
  );
}