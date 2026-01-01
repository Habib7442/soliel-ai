"use client";

import { useState, useEffect } from "react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCourseFAQs } from "@/server/actions/course-faq.actions";
import type { CourseFAQ } from "@/types/db";
import ReactMarkdown from "react-markdown";
import { HelpCircle, GripVertical } from "lucide-react";

interface CourseFaqDisplayProps {
  courseId: string;
}

export const CourseFaqDisplay = ({ courseId }: CourseFaqDisplayProps) => {
  const [faqs, setFaqs] = useState<CourseFAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      const result = await getCourseFAQs(courseId);
      if (result.success && result.data) {
        setFaqs(result.data);
      }
      setLoading(false);
    };

    fetchFaqs();
  }, [courseId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading FAQs...</p>
        </CardContent>
      </Card>
    );
  }

  if (faqs.length === 0) {
    return null;
  }

  // Group FAQs by category
  const faqsByCategory: Record<string, CourseFAQ[]> = {};
  const uncategorized: CourseFAQ[] = [];
  
  faqs.forEach(faq => {
    if (faq.category) {
      if (!faqsByCategory[faq.category]) {
        faqsByCategory[faq.category] = [];
      }
      faqsByCategory[faq.category].push(faq);
    } else {
      uncategorized.push(faq);
    }
  });
  
  // Create array of all groups (uncategorized first, then categorized)
  const allGroups = [
    ...(uncategorized.length > 0 ? [{ category: '', faqs: uncategorized }] : []),
    ...Object.entries(faqsByCategory).map(([category, faqs]) => ({ category, faqs }))
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Frequently Asked Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {allGroups.map((group, groupIndex) => (
            <div key={group.category || 'uncategorized'}>
              {group.category && (
                <h3 className="text-lg font-semibold mt-4 mb-2">{group.category}</h3>
              )}
              {group.faqs.map((faq, faqIndex) => (
                <AccordionItem key={faq.id} value={`group-${groupIndex}-item-${faqIndex}`}>
                  <AccordionTrigger className="flex items-center gap-2 py-4">
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-left">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-muted-foreground pb-4">
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>
                          {faq.answer_md}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </div>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};