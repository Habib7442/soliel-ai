"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { AlertCircle, Plus, X } from "lucide-react";

interface StepProps {
  courseData: {
    price_cents: number;
    learning_outcomes: string[];
    target_audience: string;
    requirements: string;
    allow_in_bundles: boolean;
    bundle_discount_percent: number;
    enable_qna: boolean;
    enable_reviews: boolean;
    enable_certificates: boolean;
  };
  updateCourseData: (data: Partial<StepProps['courseData']>) => void;
  instructorId: string;
  courseId: string;
  onNext: () => void;
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function Step4PricingSettings({ courseData, updateCourseData, courseId, onNext }: StepProps) {
  const [price, setPrice] = useState((courseData.price_cents / 100).toFixed(2));
  const [outcomeInput, setOutcomeInput] = useState("");

  const handlePriceChange = (value: string) => {
    setPrice(value);
    updateCourseData({ price_cents: Math.round(parseFloat(value || "0") * 100) });
  };

  const handleAddOutcome = () => {
    if (!outcomeInput.trim()) {
      toast.error("Please enter a learning outcome");
      return;
    }

    const outcomes = [...(courseData.learning_outcomes || []), outcomeInput.trim()];
    updateCourseData({ learning_outcomes: outcomes });
    setOutcomeInput("");
  };

  const handleRemoveOutcome = (index: number) => {
    const outcomes = (courseData.learning_outcomes || []).filter((_, i) => i !== index);
    updateCourseData({ learning_outcomes: outcomes });
  };

  const handleContinue = async () => {
    if ((courseData.learning_outcomes || []).length < 3) {
      toast.error("Please add at least 3 learning outcomes");
      return;
    }

    if (!courseData.target_audience?.trim()) {
      toast.error("Please describe your target audience");
      return;
    }

    try {
      const { updateCourse } = await import("@/server/actions/instructor.actions");
      
      await updateCourse(courseId, {
        price_cents: courseData.price_cents,
        learning_outcomes: courseData.learning_outcomes,
        target_audience: courseData.target_audience,
        requirements: courseData.requirements,
        allow_in_bundles: courseData.allow_in_bundles,
        bundle_discount_percent: courseData.bundle_discount_percent,
        enable_qna: courseData.enable_qna,
        enable_reviews: courseData.enable_reviews,
        enable_certificates: courseData.enable_certificates,
      });

      toast.success("Pricing & settings updated successfully!");
      onNext();
    } catch (error) {
      console.error("Error saving pricing settings:", error);
      toast.error("Failed to save settings. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Update your course pricing and configure important settings that help students understand what they&apos;ll learn.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pricing */}
        <Card className="p-6 col-span-1 md:col-span-2">
          <h3 className="font-semibold text-lg mb-4">Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Course Price (USD)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              <p className="text-sm text-muted-foreground mt-1">Set to 0 for free course</p>
            </div>
            
            <div className="flex items-center gap-2 mt-6 space-y-2">
              <input
                type="checkbox"
                id="allow_bundles"
                checked={courseData.allow_in_bundles}
                onChange={(e) => updateCourseData({ allow_in_bundles: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="allow_bundles" className="cursor-pointer">
                Allow course in bundles
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bundle_discount">Bundle Discount %</Label>
              <Input
                id="bundle_discount"
                type="number"
                value={courseData.bundle_discount_percent}
                onChange={(e) => updateCourseData({ bundle_discount_percent: parseInt(e.target.value) || 0 })}
                placeholder="0"
                min="0"
                max="100"
                disabled={!courseData.allow_in_bundles}
              />
            </div>
          </div>
        </Card>

        {/* Learning Outcomes */}
        <Card className="p-6 col-span-1 md:col-span-2">
          <h3 className="font-semibold text-lg mb-4">
            Learning Outcomes <span className="text-destructive">*</span>
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            What will students be able to do after completing this course? (Min 3, Max 10)
          </p>
          
          <div className="space-y-3">
            {(courseData.learning_outcomes || []).map((outcome, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded">
                <span className="flex-1">{outcome}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveOutcome(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {(courseData.learning_outcomes || []).length < 10 && (
            <div className="flex gap-2 mt-4">
              <Input
                value={outcomeInput}
                onChange={(e) => setOutcomeInput(e.target.value)}
                placeholder="e.g., Build responsive websites using HTML/CSS"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOutcome())}
              />
              <Button onClick={handleAddOutcome}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* Target Audience */}
        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label htmlFor="target_audience">
            Target Audience <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="target_audience"
            value={courseData.target_audience}
            onChange={(e) => updateCourseData({ target_audience: e.target.value })}
            placeholder="Who is this course for? (e.g., Beginners with no coding experience)"
            rows={3}
          />
        </div>

        {/* Requirements */}
        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label htmlFor="requirements">Requirements</Label>
          <Textarea
            id="requirements"
            value={courseData.requirements}
            onChange={(e) => updateCourseData({ requirements: e.target.value })}
            placeholder="What students need before starting (e.g., Basic computer literacy)"
            rows={3}
          />
        </div>

        {/* Course Settings */}
        <Card className="p-6 col-span-1 md:col-span-2">
          <h3 className="font-semibold text-lg mb-4">Course Settings</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable_qna"
                checked={courseData.enable_qna}
                onChange={(e) => updateCourseData({ enable_qna: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="enable_qna" className="cursor-pointer">
                Enable Q&A forum for students
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable_reviews"
                checked={courseData.enable_reviews}
                onChange={(e) => updateCourseData({ enable_reviews: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="enable_reviews" className="cursor-pointer">
                Allow student reviews
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable_certificates"
                checked={courseData.enable_certificates}
                onChange={(e) => updateCourseData({ enable_certificates: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="enable_certificates" className="cursor-pointer">
                Issue certificates upon completion
              </Label>
            </div>
          </div>
        </Card>
      </div>

      {/* Save & Continue Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button
          onClick={handleContinue}
          disabled={
            (courseData.learning_outcomes || []).length < 3 ||
            !courseData.target_audience?.trim()
          }
          className="min-w-[200px]"
        >
          Save & Continue
        </Button>
      </div>
    </div>
  );
}
