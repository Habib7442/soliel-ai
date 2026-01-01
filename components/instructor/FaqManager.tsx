"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { GripVertical, PlusCircle, Edit, Trash2, HelpCircle } from "lucide-react";
import { getAllCourseFAQs, createCourseFAQ, updateCourseFAQ, deleteCourseFAQ } from "@/server/actions/course-faq.actions";
import type { CourseFAQ } from "@/types/db";
import ReactMarkdown from "react-markdown";
import dynamic from "next/dynamic";

// Dynamically import the markdown editor to avoid SSR issues
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor"),
  { ssr: false }
);

interface FaqManagerProps {
  courseId: string;
}

interface FaqFormData {
  question: string;
  answer_md: string;
  category: string;
}

export const FaqManager = ({ courseId }: FaqManagerProps) => {
  const [courseFaqs, setCourseFaqs] = useState<CourseFAQ[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<{
    id: string;
    question: string;
    answer_md: string;
    category?: string | null;
  } | null>(null);
  const [formData, setFormData] = useState<FaqFormData>({
    question: "",
    answer_md: "",
    category: "",
  });

  useEffect(() => {
    const fetchFaqs = async () => {
      setFaqsLoading(true);
      const result = await getAllCourseFAQs(courseId);
      if (result.success && result.data) {
        setCourseFaqs(result.data);
      }
      setFaqsLoading(false);
    };

    fetchFaqs();
  }, [courseId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question.trim() || !formData.answer_md.trim()) {
      toast.error("Question and answer are required");
      return;
    }

    try {
      if (editingFaq) {
        const result = await updateCourseFAQ(editingFaq.id, courseId, {
          question: formData.question,
          answer_md: formData.answer_md,
          category: formData.category || undefined,
        });
        if (result.success) {
          toast.success("FAQ updated successfully!");
          const updatedFaqs = await getAllCourseFAQs(courseId);
          if (updatedFaqs.success && updatedFaqs.data) {
            setCourseFaqs(updatedFaqs.data);
          }
        } else {
          toast.error(result.error || "Failed to update FAQ");
        }
      } else {
        const result = await createCourseFAQ({
          course_id: courseId,
          question: formData.question,
          answer_md: formData.answer_md,
          category: formData.category || undefined,
        });

        if (result.success) {
          toast.success("FAQ created successfully!");
          const updatedFaqs = await getAllCourseFAQs(courseId);
          if (updatedFaqs.success && updatedFaqs.data) {
            setCourseFaqs(updatedFaqs.data);
          }
        } else {
          toast.error(result.error || "Failed to create FAQ");
        }
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error submitting FAQ:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleEdit = (faq: CourseFAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer_md: faq.answer_md,
      category: faq.category || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) {
      return;
    }

    const result = await deleteCourseFAQ(faqId, courseId);
    if (result.success) {
      toast.success("FAQ deleted successfully!");
      const updatedFaqs = await getAllCourseFAQs(courseId);
      if (updatedFaqs.success && updatedFaqs.data) {
        setCourseFaqs(updatedFaqs.data);
      }
    } else {
      toast.error(result.error || "Failed to delete FAQ");
    }
  };

  const resetForm = () => {
    setEditingFaq(null);
    setFormData({
      question: "",
      answer_md: "",
      category: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course FAQs</h2>
          <p className="text-muted-foreground">Manage frequently asked questions for this course. These will be displayed to students on the course page.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFaq ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
              <DialogDescription>
                {editingFaq ? "Update FAQ details" : "Create a new frequently asked question"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="question">Question *</Label>
                <Input
                  id="question"
                  name="question"
                  value={formData.question}
                  onChange={handleChange}
                  placeholder="Enter the question"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category || ""}
                  onChange={handleChange}
                  placeholder="e.g., Enrollment, Technical, Content"
                />
                <p className="text-sm text-muted-foreground">
                  Group related FAQs together
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer_md">Answer (Markdown) *</Label>
                <div data-color-mode="light">
                  <MDEditor
                    value={formData.answer_md}
                    onChange={(value) => setFormData(prev => ({ ...prev, answer_md: value || "" }))}
                    preview="edit"
                    height={300}
                    visibleDragbar={false}
                    textareaProps={{
                      placeholder: "Enter the answer in markdown format...\n\nExample:\n# Answer Title\n\n## Key Points\n- Point 1\n- Point 2\n\n**Note:** Use formatting for better structure"
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Use markdown formatting for rich text content
                </p>
              </div>

              <DialogFooter className="gap-2 sm:space-x-0">
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingFaq ? "Update FAQ" : "Create FAQ"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {faqsLoading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Loading FAQs...</p>
          </CardContent>
        </Card>
      ) : courseFaqs.length === 0 ? (
        <Alert>
          <HelpCircle className="h-4 w-4" />
          <AlertDescription>
            No FAQs yet. Click &quot;Add FAQ&quot; to create your first FAQ.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>{courseFaqs.length} question(s). Questions will be grouped by category for students.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {(() => {
                // Group FAQs by category
                const faqsByCategory: Record<string, typeof courseFaqs> = {};
                const uncategorized: typeof courseFaqs = [];
                
                courseFaqs.forEach(faq => {
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
                
                return allGroups.map((group, groupIndex) => (
                  <div key={group.category || 'uncategorized'}>
                    {group.category && (
                      <h3 className="text-lg font-semibold mt-4 mb-2">{group.category}</h3>
                    )}
                    {group.faqs.map((faq, faqIndex) => (
                      <AccordionItem key={faq.id} value={`group-${groupIndex}-item-${faqIndex}`}>
                        <div className="flex items-center justify-between pr-4">
                          <AccordionTrigger className="flex-1">
                            <div>
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <span>{faq.question}</span>
                              </div>
                              {faq.category && (
                                <span className="ml-6 text-xs bg-muted px-2 py-1 rounded-full">
                                  {faq.category}
                                </span>
                              )}
                            </div>
                          </AccordionTrigger>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(faq)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(faq.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <AccordionContent>
                          <div className="text-muted-foreground">
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
                ));
              })()}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
};