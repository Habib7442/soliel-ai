"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Step1BasicInfo } from "./Step1BasicInfo";
import { Step2Curriculum } from "./Step2Curriculum";
import { Step3ContentUpload } from "./Step3ContentUpload";
import { Step4PricingSettings } from "./Step4PricingSettings";
import { Step5ReviewPublish } from "./Step5ReviewPublish";
import type { Course } from "@/types/db";

interface CourseEditWizardProps {
  course: Course;
  instructorId: string;
  existingCategory?: string;
}

export interface EditCourseData {
  // Step 1: Basic Info
  title: string;
  subtitle: string;
  description: string;
  level: string;
  language: string;
  category: string;
  prerequisites?: string;
  estimated_duration_hours?: number;
  intro_video_url?: string;
  thumbnail_url?: string;
  
  // Step 2: Curriculum (stored temporarily)
  sections: Array<{
    id: string;
    title: string;
    description?: string;
    lessons: Array<{
      id: string;
      title: string;
      lesson_type: 'video' | 'text' | 'pdf' | 'quiz' | 'assignment' | 'lab';
      is_preview: boolean;
      content?: Record<string, unknown>;
    }>;
  }>;
  
  // Step 4: Pricing & Settings
  price_cents: number;
  currency: string;
  allow_in_bundles: boolean;
  bundle_discount_percent: number;
  learning_outcomes: string[];
  target_audience: string;
  requirements: string;
  enable_qna: boolean;
  enable_reviews: boolean;
  enable_certificates: boolean;
  drip_schedule?: Record<string, unknown>;
}

const STEPS = [
  { number: 1, title: "Basic Information", component: Step1BasicInfo },
  { number: 2, title: "Curriculum Builder", component: Step2Curriculum },
  { number: 3, title: "Content Upload", component: Step3ContentUpload },
  { number: 4, title: "Pricing & Settings", component: Step4PricingSettings },
  { number: 5, title: "Review & Update", component: Step5ReviewPublish },
];

export function CourseEditWizard({ course, instructorId, existingCategory }: CourseEditWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [courseData, setCourseData] = useState<EditCourseData>({
    title: course.title || "",
    subtitle: course.subtitle || "",
    description: course.description || "",
    level: course.level || "beginner",
    language: course.language || "english",
    category: existingCategory || "",
    prerequisites: course.prerequisites || "",
    estimated_duration_hours: course.estimated_duration_hours || undefined,
    intro_video_url: course.intro_video_url || "",
    thumbnail_url: course.thumbnail_url || "",
    sections: [],
    price_cents: course.price_cents || 0,
    currency: course.currency || "USD",
    allow_in_bundles: course.allow_in_bundles ?? true,
    bundle_discount_percent: course.bundle_discount_percent || 0,
    learning_outcomes: course.learning_outcomes || [],
    target_audience: course.target_audience || "",
    requirements: course.requirements || "",
    enable_qna: course.enable_qna ?? true,
    enable_reviews: course.enable_reviews ?? true,
    enable_certificates: course.enable_certificates ?? true,
    drip_schedule: course.drip_schedule || undefined,
  });

  // Load course sections and lessons
  useEffect(() => {
    const loadCourseContent = async () => {
      try {
        // This would be replaced with actual data fetching
        // For now, we'll initialize with empty sections
        setCourseData(prev => ({
          ...prev,
          sections: []
        }));
      } catch (error) {
        console.error("Error loading course content:", error);
        toast.error("Failed to load course content");
      }
    };

    loadCourseContent();
  }, [course.id]);

  const updateCourseData = (data: Partial<EditCourseData>) => {
    setCourseData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (stepNumber: number) => {
    // Allow navigation to previous steps or current step
    if (stepNumber <= currentStep) {
      setCurrentStep(stepNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.info("Please complete the current step first");
    }
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;
  // Ensure currentStep is within valid bounds
  const stepIndex = Math.min(Math.max(currentStep - 1, 0), STEPS.length - 1);
  const CurrentStepComponent = STEPS[stepIndex]?.component;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Progress Header */}
      <Card className="p-6 mb-8">
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Step {currentStep} of {STEPS.length}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between items-center mt-6">
            {STEPS.map((step) => (
              <button
                key={step.number}
                onClick={() => handleStepClick(step.number)}
                className={`flex flex-col items-center gap-2 flex-1 transition-all ${
                  step.number === currentStep
                    ? 'opacity-100'
                    : step.number < currentStep
                    ? 'opacity-60 hover:opacity-80 cursor-pointer'
                    : 'opacity-30 cursor-not-allowed'
                }`}
                disabled={step.number > currentStep}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    step.number === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.number < currentStep
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.number < currentStep ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span className={`text-xs text-center hidden md:block ${
                  step.number === currentStep ? 'font-semibold' : 'font-normal'
                }`}>
                  {step.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Current Step Content */}
      <Card className="p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{STEPS[currentStep - 1].title}</h2>
        </div>

        <CurrentStepComponent
          courseData={courseData as Record<string, unknown> & EditCourseData}
          updateCourseData={updateCourseData}
          instructorId={instructorId}
          courseId={course.id}
          onNext={handleNext}
          onBack={handleBack}
          isFirstStep={currentStep === 1}
          isLastStep={currentStep === STEPS.length}
        />
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        {/* No Next button - each step handles its own Save & Continue */}
      </div>
    </div>
  );
}