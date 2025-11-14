"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface StepProps {
  courseData: Record<string, unknown>;
  updateCourseData: (data: Record<string, unknown>) => void;
  instructorId: string;
  courseId: string;
  onNext: () => void;
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function Step5ReviewPublish({ courseId }: StepProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveChanges = async () => {
    setIsSubmitting(true);

    try {
      toast.success("Course updated successfully!");
      router.push(`/instructor/courses/${courseId}`);
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Failed to update course");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Review your changes before saving. Your course will be updated immediately.
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold">All Changes Ready</h3>
            <p className="text-sm text-muted-foreground">
              Your course updates are ready to be saved. Click the button below to apply all changes.
            </p>
          </div>
        </div>
      </Card>

      {/* Save Changes Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button
          onClick={handleSaveChanges}
          disabled={isSubmitting}
          className="min-w-[200px]"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving Changes...
            </>
          ) : (
            "Save All Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
