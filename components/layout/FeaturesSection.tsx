"use client";

import { motion } from "framer-motion";
import { 
  Building2, 
  ShieldCheck, 
  MonitorPlay, 
  BarChart3, 
  BrainCircuit, 
  CreditCard, 
  Settings2, 
  Network 
} from "lucide-react";

const features = [
  {
    title: "Next-Gen Architecture",
    description: "Lightning-fast performance powered by Next.js & Supabase edge nodes.",
    icon: Network,
    tech: "Edge Runtime"
  },
  {
    title: "Secure Auth",
    description: "Enterprise-grade JWT and OAuth2 security for your data.",
    icon: ShieldCheck,
    tech: "Supabase Auth"
  },
  {
    title: "Immersive Learning",
    description: "High-def video player with integrated coding sandboxes.",
    icon: MonitorPlay,
    tech: "Player v2"
  },
  {
    title: "Deep Analytics",
    description: "Visualize your growth with detailed competency heatmaps.",
    icon: BarChart3,
    tech: "Postgres Realtime"
  },
  {
    title: "AI Co-pilot",
    description: "Automated grading and personalized tutoring on every lesson.",
    icon: BrainCircuit,
    tech: "LLM Orchestrator"
  },
  {
    title: "Global Payments",
    description: "Start learning in seconds with Stripe integration in 135+ currencies.",
    icon: CreditCard,
    tech: "Stripe"
  },
  {
    title: "Instructor Tools",
    description: "Intuitive curriculum builder with real-time preview.",
    icon: Settings2,
    tech: "Admin Engine"
  },
  {
    title: "B2B Infrastructure",
    description: "Multi-tenant support designed for scale and enterprise trust.",
    icon: Building2,
    tech: "Multi-tenant"
  }
];

const techStack = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Tailwind CSS",
  "shadcn/ui",
  "Supabase",
  "Postgres",
  "Stripe"
];

export function FeaturesSection() {
  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-6"
          >
            Capabilities
          </motion.div>
          <motion.h2 
            className="text-4xl md:text-5xl font-black mb-6 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Built for the <span className="text-primary italic">Modern</span> Era.
          </motion.h2>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Our tech stack is as cutting-edge as the content we teach.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-32">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group p-5 rounded-2xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-300 h-full flex flex-col items-start"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300 border border-gray-100">
                <feature.icon className="w-5 h-5" />
              </div>
              
              <h3 className="text-sm font-bold mb-3 text-gray-900 leading-tight">
                {feature.title}
              </h3>
              
              <p className="text-[10px] text-muted-foreground font-medium leading-relaxed mb-4">
                {feature.description}
              </p>

              <div className="mt-auto pt-3 border-t border-gray-50 w-full">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                  {feature.tech}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}