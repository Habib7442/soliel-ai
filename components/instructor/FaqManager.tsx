"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { 
  getCourseFaqs,
  createCourseFaq,
  updateCourseFaq,
  deleteCourseFaq
} from "@/server/actions/instructor.actions";
import { useInstructorStore } from "@/hooks/useInstructorStore";
import { PlusCircle, Edit, Trash2, HelpCircle } from "lucide-react";

interface FaqManagerProps {
  courseId: string;
}

export const FaqManager = ({ courseId }: FaqManagerProps) => {
  const { courseFaqs, setCourseFaqs, faqsLoading, setFaqsLoading } = useInstructorStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<{
    id: string;
    question: string;
    answer_md: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer_md: "",
  });

  useEffect(() => {
    const fetchFaqs = async () => {
      setFaqsLoading(true);
      const result = await getCourseFaqs(courseId);
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
        const result = await updateCourseFaq(editingFaq.id, formData);
        if (result.success) {
          toast.success("FAQ updated successfully!");
          const updatedFaqs = await getCourseFaqs(courseId);
          if (updatedFaqs.success && updatedFaqs.data) {
            setCourseFaqs(updatedFaqs.data);
          }
        } else {
          toast.error(result.error || "Failed to update FAQ");
        }
      } else {
        const result = await createCourseFaq({
          course_id: courseId,
          question: formData.question,
          answer_md: formData.answer_md,
        });

        if (result.success) {
          toast.success("FAQ created successfully!");
          const updatedFaqs = await getCourseFaqs(courseId);
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

  const handleEdit = (faq: { id: string; question: string; answer_md: string }) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer_md: faq.answer_md,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) {
      return;
    }

    const result = await deleteCourseFaq(faqId);
    if (result.success) {
      toast.success("FAQ deleted successfully!");
      const updatedFaqs = await getCourseFaqs(courseId);
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
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course FAQs</h2>
          <p className="text-muted-foreground">Manage frequently asked questions for this course</p>
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingFaq ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
              <DialogDescription>
                {editingFaq ? "Update FAQ details" : "Create a new frequently asked question"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
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

              <div>
                <Label htmlFor="answer_md">Answer (Markdown) *</Label>
                <Textarea
                  id="answer_md"
                  name="answer_md"
                  value={formData.answer_md}
                  onChange={handleChange}
                  placeholder="Enter the answer in markdown format..."
                  rows={8}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Use markdown formatting for rich text content
                </p>
              </div>

              <DialogFooter>
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
            <CardDescription>{courseFaqs.length} question(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {courseFaqs.map((faq, index) => (
                <AccordionItem key={faq.id} value={`item-${index}`}>
                  <div className="flex items-center justify-between pr-4">
                    <AccordionTrigger className="flex-1">
                      {faq.question}
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
                    <div className="text-muted-foreground whitespace-pre-wrap">
                      {faq.answer_md}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
