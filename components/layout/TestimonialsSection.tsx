"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Alexandra Thompson",
    role: "Data Scientist at Google",
    course: "AI for Everyone",
    content: "The AI course completely transformed my career. The hands-on labs and real-world projects gave me the confidence to transition into machine learning. The instructors are world-class!",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexandra"
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    role: "Software Engineer at Microsoft",
    course: "Python with Docker Labs",
    content: "The Python course with Docker labs is incredible. Being able to code in a real environment from day one made all the difference. I landed my dream job thanks to the skills I learned here.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus"
  },
  {
    id: 3,
    name: "Dr. Priya Patel",
    role: "Research Scientist at Stanford",
    course: "ML with Live Assignments",
    content: "As someone with a PhD, I was skeptical about online courses. But the depth and quality here rivals any university program. The live assignments and AI-powered feedback are revolutionary.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya"
  },
  {
    id: 4,
    name: "James Chen",
    role: "Startup Founder",
    course: "AI for Everyone",
    content: "I built my entire AI startup based on what I learned here. The courses are practical, up-to-date, and taught by industry experts. The community support is amazing too!",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James"
  },
  {
    id: 5,
    name: "Sarah Kim",
    role: "ML Engineer at Tesla",
    course: "Machine Learning Fundamentals",
    content: "The interactive labs saved me months of setup time. I could focus on learning rather than configuration. The progress tracking helped me stay motivated throughout my journey.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
  },
  {
    id: 6,
    name: "David Wilson",
    role: "Product Manager at Meta",
    course: "AI Product Management",
    content: "Perfect for busy professionals. The flexible schedule and bite-sized lessons fit perfectly into my work routine. The certificates are recognized by top tech companies.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David"
  }
];

const stats = [
  { value: "4.9/5", label: "Global Rating", icon: "⭐" },
  { value: "50,000+", label: "Gen Z Learners", icon: "🚀" },
  { value: "95%", label: "Completion Rate", icon: "✅" }
];

export function TestimonialsSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gray-50/50">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-6"
          >
            Social Proof
          </motion.div>
          <motion.h2 
            className="text-4xl md:text-5xl font-black mb-6 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Trusted by the <span className="text-primary italic">Best.</span>
          </motion.h2>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Join 50k+ professionals and students who are building the future with Soliel AI.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="group relative h-full pt-10 pb-8 px-6 bg-white rounded-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100 text-center flex flex-col items-center hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] transition-all duration-500"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-500">{stat.icon}</div>
              <div className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">{stat.value}</div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/50 flex flex-col hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] transition-all duration-500"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 text-yellow-500 fill-current" />
                ))}
              </div>
              
              <p className="text-gray-700 leading-relaxed mb-8 flex-1 font-medium">
                &#34;{testimonial.content}&#34;
              </p>
              
              <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                <Avatar className="h-14 w-14 rounded-2xl shadow-lg border-2 border-white">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold">{testimonial.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-gray-900 leading-tight">{testimonial.name}</h4>
                  <p className="text-xs text-muted-foreground font-semibold">{testimonial.role}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-3 py-1 rounded-full">
                  Skill: {testimonial.course.split(' ').slice(0, 2).join(' ')}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}