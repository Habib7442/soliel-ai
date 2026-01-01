"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    id: 1,
    name: "Alexandra Thompson",
    role: "Data Scientist at Google",
    course: "AI for Everyone",
    content: "The AI course completely transformed my career. The hands-on labs and real-world projects gave me the confidence to transition into machine learning. The instructors are world-class!",
    avatar: "/images/testimonials/alexandra.jpg"
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    role: "Software Engineer at Microsoft",
    course: "Python with Docker Labs",
    content: "The Python course with Docker labs is incredible. Being able to code in a real environment from day one made all the difference. I landed my dream job thanks to the skills I learned here.",
    avatar: "/images/testimonials/marcus.jpg"
  },
  {
    id: 3,
    name: "Dr. Priya Patel",
    role: "Research Scientist at Stanford",
    course: "ML with Live Assignments",
    content: "As someone with a PhD, I was skeptical about online courses. But the depth and quality here rivals any university program. The live assignments and AI-powered feedback are revolutionary.",
    avatar: "/images/testimonials/priya.jpg"
  },
  {
    id: 4,
    name: "James Chen",
    role: "Startup Founder",
    course: "AI for Everyone",
    content: "I built my entire AI startup based on what I learned here. The courses are practical, up-to-date, and taught by industry experts. The community support is amazing too!",
    avatar: "/images/testimonials/james.jpg"
  },
  {
    id: 5,
    name: "Sarah Kim",
    role: "ML Engineer at Tesla",
    course: "Machine Learning Fundamentals",
    content: "The interactive labs saved me months of setup time. I could focus on learning rather than configuration. The progress tracking helped me stay motivated throughout my journey.",
    avatar: "/images/testimonials/sarah.jpg"
  },
  {
    id: 6,
    name: "David Wilson",
    role: "Product Manager at Meta",
    course: "AI Product Management",
    content: "Perfect for busy professionals. The flexible schedule and bite-sized lessons fit perfectly into my work routine. The certificates are recognized by top tech companies.",
    avatar: "/images/testimonials/david.jpg"
  }
];

const stats = [
  { value: "4.9/5", label: "Average Rating" },
  { value: "50,000+", label: "Happy Students" },
  { value: "95%", label: "Completion Rate" }
];

export function TestimonialsSection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          What Our Students Say
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Join thousands of professionals who have transformed their careers with our AI education platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            className="bg-card rounded-xl p-6 shadow-lg text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
            <div className="text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.id}
            className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center mb-4">
              <Avatar className="h-12 w-12 mr-4">
                <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold">{testimonial.name}</h3>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
            
            <p className="text-foreground mb-4 italic">&#34;{testimonial.content}&#34;</p>
            
            <div className="text-sm text-primary font-medium">
              Completed: {testimonial.course}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}