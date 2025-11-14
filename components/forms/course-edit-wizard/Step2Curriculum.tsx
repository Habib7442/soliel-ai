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

export function Step2Curriculum({ courseId, onNext }: StepProps) {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Curriculum editing is available. Use the dedicated curriculum manager in the course details page for advanced section and lesson management.
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
