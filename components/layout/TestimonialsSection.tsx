"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

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

// Double the testimonials for "infinite" feel
const displayTestimonials = [...testimonials, ...testimonials];

const stats = [
  { value: "4.9/5", label: "Global Rating", icon: "⭐" },
  { value: "50,000+", label: "Gen Z Learners", icon: "🚀" },
  { value: "95%", label: "Completion Rate", icon: "✅" }
];

export function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = window.innerWidth < 640 ? clientWidth * 0.8 : 340;
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gray-50/50">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="group relative h-full pt-10 pb-8 px-6 bg-white rounded-2xl shadow-sm border border-gray-100 text-center flex flex-col items-center hover:shadow-md transition-all duration-300"
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

        <div className="relative group/swiper">
          {/* Navigation Arrows */}
          <button 
            onClick={() => scroll('left')}
            className="absolute -left-4 top-1/2 -translate-y-full z-20 w-12 h-12 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/swiper:opacity-100 hidden md:flex"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => scroll('right')}
            className="absolute -right-4 top-1/2 -translate-y-full z-20 w-12 h-12 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/swiper:opacity-100 hidden md:flex"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div 
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth"
          >
            {displayTestimonials.map((testimonial, index) => (
              <motion.div
                key={`${testimonial.id}-${index}`}
                className="flex-shrink-0 w-[75vw] sm:w-[320px] bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50 flex flex-col hover:shadow-md transition-all duration-300 snap-center"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: (index % testimonials.length) * 0.05 }}
                viewport={{ once: true }}
              >
                <div className="flex gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3 h-3 text-yellow-500 fill-current" />
                  ))}
                </div>
                
                <p className="text-xs text-gray-700 leading-relaxed mb-6 flex-1 font-medium italic">
                  &#34;{testimonial.content}&#34;
                </p>
                
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <Avatar className="h-10 w-10 rounded-xl shadow-md border-2 border-white">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">{testimonial.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 leading-tight text-xs truncate">{testimonial.name}</h4>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5 truncate">{testimonial.role.split(' at ')[0]}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="inline-block text-[8px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                    {testimonial.course.split(' ').slice(0, 2).join(' ')}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}