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
          <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Features
          </span>
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Discover what makes Soliel AI the best platform for learning and teaching
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group relative p-8 rounded-2xl bg-card border hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative z-10">
              <div className="mb-4 inline-block p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
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