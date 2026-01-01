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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/5 to-primary/5" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8 text-center lg:text-left">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 transition-colors px-4 py-1.5 text-sm">
              Our Mission
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
              Empowering the Next Generation of <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">AI Innovators</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Soliel AI is bridging the gap between theoretical knowledge and practical application. We provide a cutting-edge platform where students globally can master Artificial Intelligence through hands-on labs and real-world projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-primary-foreground shadow-lg border-0 h-12 px-8 text-lg">
                <Link href="/courses">Explore Courses</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 text-lg border-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-gray-800 border dark:border-gray-700">
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
      </section>



      {/* Story & Values */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why We Started</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The rapid evolution of AI created a massive skills gap. We built Soliel AI to close it.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-none shadow-lg bg-white dark:bg-gray-800/50 hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="pt-8 px-8 pb-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Innovation First</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We believe in learning by doing. Our platform emphasizes practical, hands-on experience with the latest AI tools and frameworks, not just theory.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white dark:bg-gray-800/50 hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="pt-8 px-8 pb-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Global Accessibility</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Education should have no borders. We are committed to making high-quality AI education accessible to anyone, anywhere, at an affordable price.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white dark:bg-gray-800/50 hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="pt-8 px-8 pb-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Community Driven</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Learning is better together. Our vibrant community of students, mentors, and industry experts supports each other every step of the way.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of students who are already building the future with Soliel AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-primary-foreground shadow-lg h-14 px-8 text-lg rounded-full">
              <Link href="/sign-up">Get Started for Free</Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>No credit card required</span>
            <span className="mx-2">•</span>
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </section>
    </div>
  );
}