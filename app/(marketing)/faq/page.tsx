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
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
        <div className="container mx-auto px-4 py-20 md:py-28 text-center relative z-10">
          <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full">
            Help Center
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-gray-900 dark:text-white">
            How can we <span className="text-primary">help?</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Search our knowledge base or browse frequently asked questions to find the answers you need.
          </p>
          
          <div className="max-w-xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              type="text"
              placeholder="Search for answers..."
              className="pl-12 h-14 text-lg rounded-full shadow-xl shadow-primary/5 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 focus-visible:ring-primary/20"
            />
          </div>
        </div>
      </section>

      {/* Stats Summary */}
      <section className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            { label: "Questions", value: faqs.length, icon: Book, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Updates", value: "Weekly", icon: Activity, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Support", value: "24/7", icon: Zap, color: "text-orange-500", bg: "bg-orange-500/10" },
            { label: "Avg. Response", value: "<1 min", icon: Clock, color: "text-purple-500", bg: "bg-purple-500/10" }
          ].map((stat, i) => (
             <Card key={i} className="border-0 shadow-lg shadow-gray-200/50 dark:shadow-none bg-white dark:bg-gray-800">
               <CardContent className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4 h-full">
                 <div className={`p-2.5 sm:p-3 rounded-xl ${stat.bg} ${stat.color} shrink-0`}>
                   <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                 </div>
                 <div className="min-w-0">
                   <p className="text-xl sm:text-2xl font-bold font-mono leading-none">{stat.value}</p>
                   <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider truncate mt-1">{stat.label}</p>
                 </div>
               </CardContent>
             </Card>
          ))}
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="space-y-16">
          {Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
            <div key={category} className="scroll-mt-24" id={category.toLowerCase().replace(/\s+/g, '-')}>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-8 w-1 bg-primary rounded-full"></div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{category}</h2>
                <Badge variant="secondary" className="ml-auto">
                  {categoryFaqs.length} Qs
                </Badge>
              </div>

              <div className="grid gap-4">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {categoryFaqs.map((faq, index) => (
                    <AccordionItem
                      key={faq.id}
                      value={`${category}-${index}`}
                      className="border border-gray-200 dark:border-gray-800 rounded-xl px-2 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg group">
                        <span className="text-left font-semibold text-lg text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">
                          {faq.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-6 pt-2">
                        <div className="text-muted-foreground leading-relaxed text-base border-t border-gray-100 dark:border-gray-800 pt-4">
                           {faq.answer.split('\n').map((line, i) => (
                             <p key={i} className="mb-2 last:mb-0">{line}</p>
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
      <section className="container mx-auto px-4 pb-20 max-w-5xl">
        <div className="bg-gradient-to-br from-gray-900 to-black dark:from-white dark:to-gray-200 rounded-3xl p-8 md:p-12 text-white dark:text-gray-900 shadow-2xl relative overflow-hidden">
           {/* Decorative circles */}
           <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 dark:bg-black/5 rounded-full blur-3xl" />
           <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />

           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div className="max-w-xl">
                 <h2 className="text-3xl md:text-4xl font-bold mb-4">Still have questions?</h2>
                 <p className="text-white/80 dark:text-gray-600/80 text-lg">
                    Can&apos;t find the answer you&apos;re looking for? Please chat to our friendly team.
                 </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                 <Button size="lg" className="bg-white text-black hover:bg-gray-100 dark:bg-black dark:text-white dark:hover:bg-gray-900 h-14 px-8 rounded-full text-base font-semibold shadow-lg">
                    Get in touch
                 </Button>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
}