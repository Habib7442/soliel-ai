"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

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

export function Step3ContentUpload({ courseId, onNext }: StepProps) {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Content upload is available. Use the dedicated content manager in the course details page to add or update lesson content.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end pt-6 border-t">
        <Button onClick={onNext} className="min-w-[200px]">
          Save & Continue
        </Button>
      </div>
    </div>
  );
}
