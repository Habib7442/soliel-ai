"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { submitCourseForReview } from "@/server/actions/instructor.actions";
import type { CourseData } from "./CourseWizard";

interface StepProps {
  courseData: CourseData;
  updateCourseData: (data: Partial<CourseData>) => void;
  instructorId: string;
  onNext: () => void;
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  clearWizardData?: () => void;
}

export function Step5ReviewPublish({ courseData, clearWizardData }: StepProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalLessons = courseData.sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const totalOutcomes = (courseData.learning_outcomes || []).length;

  const checklist = [
    { label: "Basic Information Complete", completed: !!courseData.title && !!courseData.subtitle && !!courseData.description },
    { label: `Curriculum Structured (${courseData.sections.length} sections, ${totalLessons} lessons)`, completed: courseData.sections.length > 0 && totalLessons >= 3 },
    { label: "Pricing Set", completed: courseData.price_cents !== undefined },
    { label: "Thumbnail Uploaded", completed: !!courseData.thumbnail_url },
    { label: `Learning Outcomes Added (${totalOutcomes} items)`, completed: totalOutcomes >= 3 },
    { label: "Target Audience Defined", completed: !!courseData.target_audience },
  ];

  const allComplete = checklist.every(item => item.completed);

  const handleSubmitForReview = async () => {
    if (!courseData.courseId) {
      toast.error("No course ID found");
      return;
    }

    if (!allComplete) {
      toast.error("Please complete all required sections first");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitCourseForReview(courseData.courseId);
      
      if (result.success) {
        toast.success("Course submitted for admin review!");
        
        // Clear wizard data from localStorage
        if (clearWizardData) {
          clearWizardData();
        }
        
        router.push("/instructor-dashboard");
      } else {
        toast.error(result.error || "Failed to submit for review");
      }
    } catch (error) {
      console.error("Error submitting course:", error);
      toast.error("Failed to submit course");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Review your course details before submitting for admin approval.
        </AlertDescription>
      </Alert>

      {/* Completion Checklist */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Completion Checklist</h3>
        <div className="space-y-3">
          {checklist.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              {item.completed ? (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              )}
              <span className={item.completed ? "text-foreground" : "text-muted-foreground"}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Course Summary */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Course Summary</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Title</p>
            <p className="font-medium">{courseData.title}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="font-medium">${(courseData.price_cents / 100).toFixed(2)}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Structure</p>
            <div className="flex gap-4 mt-1">
              <Badge variant="secondary">{courseData.sections.length} Sections</Badge>
              <Badge variant="secondary">{totalLessons} Lessons</Badge>
              <Badge variant="secondary" className="capitalize">{courseData.level}</Badge>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Settings</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {courseData.enable_qna && <Badge variant="outline">Q&A Enabled</Badge>}
              {courseData.enable_reviews && <Badge variant="outline">Reviews Enabled</Badge>}
              {courseData.enable_certificates && <Badge variant="outline">Certificates</Badge>}
              {courseData.allow_in_bundles && <Badge variant="outline">Available in Bundles</Badge>}
            </div>
          </div>
        </div>
      </Card>

      {/* Publishing Options */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Submit Course for Review</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Admin Review Required</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Submit your course for admin approval. You&apos;ll be notified within 48 hours. Your course will be reviewed for quality and compliance before being published.
            </p>
            <Button
              onClick={handleSubmitForReview}
              disabled={isSubmitting || !allComplete}
              className="w-full sm:w-auto min-w-[200px]"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Review"
              )}
            </Button>
          </div>
        </div>
      </Card>

      {!allComplete && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please complete all required sections before submitting for review.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
