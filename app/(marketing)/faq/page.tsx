import { Metadata } from "next";
import { Search, HelpCircle, MessageCircle, Mail, Book, Clock, Activity, Zap, ChevronRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveFAQs, getFAQCategories } from "@/server/actions/faq.actions";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions | Soliel AI",
  description: "Find answers to common questions about our learning platform, courses, payments, certificates, and more.",
};

export default async function FAQPage() {
  const [faqsResult, categoriesResult] = await Promise.all([
    getActiveFAQs(),
    getFAQCategories(),
  ]);

  const faqs = faqsResult.success ? faqsResult.data || [] : [];
  const categories = categoriesResult.success ? categoriesResult.data || [] : [];

  // Group FAQs by category
  const faqsByCategory = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, typeof faqs>);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/2 left-0 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 px-4 sm:px-6 lg:px-8 selection:bg-primary selection:text-white">
        <div className="container mx-auto text-center relative z-10">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 transition-colors px-4 py-1.5 text-sm font-bold uppercase tracking-widest rounded-full mb-8">
            Help Center
          </Badge>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 tracking-tight text-gray-900 leading-[1.1]">
            How can we <br />
            <span className="text-primary italic">help?</span>
          </h1>
          <p className="text-xl text-muted-foreground/80 max-w-2xl mx-auto mb-12 leading-relaxed">
            Search our knowledge base or browse frequently asked questions to find the answers you need.
          </p>
          
          <div className="max-w-xl mx-auto relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              type="text"
              placeholder="Search for answers..."
              className="pl-16 h-16 text-lg rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-gray-100 bg-white/70 backdrop-blur-xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
            />
          </div>
        </div>
      </section>

      {/* Stats Summary */}
      <section className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { label: "Questions", value: faqs.length, icon: Book, color: "text-blue-600", bg: "bg-blue-100" },
            { label: "Updates", value: "Weekly", icon: Activity, color: "text-green-600", bg: "bg-green-100" },
            { label: "Support", value: "24/7", icon: Zap, color: "text-orange-600", bg: "bg-orange-100" },
            { label: "Avg. Response", value: "<1 min", icon: Clock, color: "text-purple-600", bg: "bg-purple-100" }
          ].map((stat, i) => (
             <Card key={i} className="group border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 rounded-3xl overflow-hidden">
               <CardContent className="p-6 flex items-center gap-5 h-full">
                 <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shrink-0 transform group-hover:scale-110 transition-transform duration-500`}>
                   <stat.icon className="w-7 h-7" />
                 </div>
                 <div className="min-w-0">
                   <p className="text-2xl font-black leading-none">{stat.value}</p>
                   <p className="text-[10px] sm:text-xs text-muted-foreground font-black uppercase tracking-[0.2em] mt-2 whitespace-nowrap">{stat.label}</p>
                 </div>
               </CardContent>
             </Card>
          ))}
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="container mx-auto px-4 py-24 md:py-32 max-w-4xl">
        <div className="space-y-20">
          {Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
            <div key={category} className="scroll-mt-32" id={category.toLowerCase().replace(/\s+/g, '-')}>
              <div className="flex items-center gap-6 mb-10 pb-6 border-b border-gray-100">
                <div className="h-10 w-1.5 bg-primary rounded-full"></div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">{category}</h2>
                <Badge className="ml-auto bg-gray-100 text-gray-600 font-bold px-4 py-1.5 rounded-xl">
                  {categoryFaqs.length} Questions
                </Badge>
              </div>

              <div className="grid gap-6">
                <Accordion type="single" collapsible className="w-full space-y-5">
                  {categoryFaqs.map((faq, index) => (
                    <AccordionItem
                      key={faq.id}
                      value={`${category}-${index}`}
                      className="border-0 rounded-3xl px-2 bg-white/60 backdrop-blur-sm overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:bg-white transition-all duration-300"
                    >
                      <AccordionTrigger className="px-6 py-6 hover:no-underline group">
                        <span className="text-left font-bold text-xl text-gray-800 group-hover:text-primary transition-colors pr-4">
                          {faq.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-8 pt-2">
                        <div className="text-muted-foreground/80 leading-relaxed font-medium text-lg border-t border-gray-50 pt-6">
                           {faq.answer.split('\n').map((line, i) => (
                             <p key={i} className="mb-3 last:mb-0">{line}</p>
                           ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Support */}
      <section className="container mx-auto px-4 pb-24 max-w-5xl">
        <div className="relative rounded-[3rem] overflow-hidden bg-gray-950 p-12 md:p-16 text-center shadow-2xl">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] opacity-30" />

          <div className="relative z-10 flex flex-col items-center justify-center gap-10">
            <div className="max-w-2xl">
               <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Still have <span className="text-primary italic">questions?</span></h2>
               <p className="text-gray-400 text-lg leading-relaxed font-medium">
                  Can't find the answer you're looking for? Please chat to our friendly team. We're here to help you succeed.
               </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
               <Button size="xl" className="bg-primary hover:bg-primary/90 text-white font-black text-lg h-16 px-12 rounded-2xl shadow-xl shadow-primary/20 transform hover:scale-105 active:scale-95 transition-all border-0">
                  Get in touch
               </Button>
               <Button size="xl" variant="outline" className="border-gray-800 text-white hover:bg-gray-900 h-16 px-12 rounded-2xl font-bold transition-all">
                  Chat Support
               </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Bottom Spacer */}
      <div className="h-20" />
    </div>
  );
}
