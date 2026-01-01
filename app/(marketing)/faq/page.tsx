import { Metadata } from "next";
import { Search, HelpCircle, MessageCircle, Mail } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveFAQs, getFAQCategories } from "@/server/actions/faq.actions";
import Link from "next/link";

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
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#FF0000] to-[#CC0000] text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <HelpCircle className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Find answers to common questions about our platform, courses, and services
          </p>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#FF0000]">{faqs.length}</div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#FF0000]">{categories.length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#FF0000]">24/7</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#FF0000]">&lt;1min</div>
              <div className="text-sm text-muted-foreground">Response</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Search Section - Client-side component would go here */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search FAQs... (e.g., refund, certificate, payment)"
              className="pl-12 h-14 text-lg"
              id="faq-search"
            />
          </div>
          <p className="text-sm text-muted-foreground text-center mt-4">
            Try searching: &quot;refund policy&quot;, &quot;certificate&quot;, &quot;payment methods&quot;
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-8">
          {Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-[#FF0000] text-white text-sm px-3 py-1">
                  {category}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {categoryFaqs.length} {categoryFaqs.length === 1 ? 'question' : 'questions'}
                </span>
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                {categoryFaqs.map((faq, index) => (
                  <AccordionItem
                    key={faq.id}
                    value={`${category}-${index}`}
                    className="border rounded-lg px-6 hover:border-[#FF0000]/30 transition-colors"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      <span className="font-semibold">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4 pt-2 whitespace-pre-wrap">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Support */}
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <Card className="border-2 border-[#FF0000]/20">
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-[#FF0000]" />
            <h2 className="text-2xl font-bold mb-2">Still have questions?</h2>
            <p className="text-muted-foreground mb-6">
              Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gradient-to-r from-[#FF0000] to-[#CC0000]">
                <Link href="mailto:support@soliel-ai.com">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-[#FF0000] text-[#FF0000] hover:bg-[#FF0000]/10">
                <Link href="/blog">
                  Visit Our Blog
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}