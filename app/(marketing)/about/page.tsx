import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Globe, Users, Zap, Award, BookOpen } from "lucide-react";

export const metadata = {
  title: "About Us - Soliel AI",
  description: "Empowering the next generation of AI innovators through accessible, high-quality education.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/2 left-0 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 right-1/4 translate-y-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] -z-10" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 px-4 sm:px-6 lg:px-8 selection:bg-primary selection:text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="space-y-10 text-center lg:text-left z-10">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 transition-colors px-4 py-1.5 text-sm font-bold uppercase tracking-widest rounded-full">
                Our Mission
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1]">
                Empowering the <br />
                Next Generation of <br />
                <span className="text-primary italic">AI Innovators</span>
              </h1>
              <p className="text-xl text-muted-foreground/80 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Soliel AI is bridging the gap between theoretical knowledge and practical application. We provide a cutting-edge platform where students globally can master Artificial Intelligence through hands-on labs and real-world projects.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                <Button asChild size="xl" className="rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-10 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 border-0 font-black">
                  <Link href="/courses">Explore Courses</Link>
                </Button>
                <Button asChild size="xl" variant="outline" className="rounded-2xl text-lg px-10 transition-all hover:bg-gray-50 border-gray-200 font-bold">
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
            
            <div className="relative group">
              {/* Decorative rings */}
              <div className="absolute -top-10 -right-10 w-32 h-32 border-4 border-primary/10 rounded-full animate-pulse" />
              <div className="absolute -bottom-10 -left-10 w-24 h-24 border-4 border-primary/5 rounded-full" />
              
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border-8 border-white bg-white group-hover:shadow-[0_48px_80px_-20px_rgba(0,0,0,0.15)] transition-all duration-500">
                <Image
                  src="/images/about-hero.png"
                  alt="Soliel AI Future of Learning"
                  width={800}
                  height={800}
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story & Values */}
      <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-gray-50/50 border-y border-gray-100/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Why We <span className="text-primary italic">Started</span></h2>
            <p className="text-xl text-muted-foreground/80 max-w-3xl mx-auto leading-relaxed">
              The rapid evolution of AI created a massive skills gap. We built Soliel AI to close it and empower the next generation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                title: "Innovation First",
                description: "We believe in learning by doing. Our platform emphasizes practical, hands-on experience with the latest AI tools and frameworks.",
                icon: Zap,
                color: "bg-orange-100 text-orange-600"
              },
              {
                title: "Global Accessibility",
                description: "Education should have no borders. We are committed to making high-quality AI education accessible anyone, anywhere.",
                icon: Globe,
                color: "bg-blue-100 text-blue-600"
              },
              {
                title: "Community Driven",
                description: "Learning is better together. Our vibrant community of students and mentors supports each other every step of the way.",
                icon: Users,
                color: "bg-indigo-100 text-indigo-600"
              }
            ].map((value, i) => (
              <Card key={i} className="group border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 rounded-[2rem] overflow-hidden">
                <CardContent className="pt-12 px-10 pb-12 text-center">
                  <div className={`w-20 h-20 rounded-3xl ${value.color} flex items-center justify-center mx-auto mb-8 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shadow-lg shadow-black/5`}>
                    <value.icon className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 tracking-tight">{value.title}</h3>
                  <p className="text-muted-foreground/80 leading-relaxed font-medium">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-[3rem] overflow-hidden bg-gray-950 p-12 md:p-20 text-center shadow-2xl">
            {/* CTA Background decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 tracking-tight">
                Ready to Start Your <br />
                <span className="text-primary italic">Journey?</span>
              </h2>
              <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                Join thousands of students who are already building the future with Soliel AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button asChild size="xl" className="rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg px-12 h-16 shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 border-0">
                  <Link href="/sign-up">Get Started for Free</Link>
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-bold text-gray-500 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Bottom Spacer */}
      <div className="h-20" />
    </div>
  );
}
