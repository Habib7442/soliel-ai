"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PlusCircle, GripVertical, Edit, Trash2, Video, FileText, HelpCircle, CheckSquare, Code, AlertCircle } from "lucide-react";
import type { CourseData } from "./CourseWizard";

interface StepProps {
  courseData: CourseData;
  updateCourseData: (data: Partial<CourseData>) => void;
  instructorId: string;
  onNext: () => void;
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

type LessonType = 'video' | 'text' | 'pdf' | 'quiz' | 'assignment' | 'lab';

const LESSON_TYPES: { value: LessonType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'video', label: 'Video Lesson', icon: Video },
  { value: 'text', label: 'Text/Article', icon: FileText },
  { value: 'pdf', label: 'PDF Document', icon: FileText },
  { value: 'quiz', label: 'Quiz', icon: HelpCircle },
  { value: 'assignment', label: 'Assignment', icon: CheckSquare },
  { value: 'lab', label: 'Hands-on Lab', icon: Code },
];

export function Step2Curriculum({ courseData, updateCourseData, onNext }: StepProps) {
  const [sections, setSections] = useState(courseData.sections || []);
  const [isAddingSectionDialogOpen, setIsAddingSectionDialogOpen] = useState(false);
  const [isAddingLessonDialogOpen, setIsAddingLessonDialogOpen] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number | null>(null);
  const [editingSection, setEditingSection] = useState<{ index: number; id: string; title: string; description?: string } | null>(null);
  const [editingLesson, setEditingLesson] = useState<{ index: number; id: string; title: string; lesson_type: LessonType; is_preview: boolean } | null>(null);
  
  const [sectionForm, setSectionForm] = useState({
    title: "",
    description: "",
  });
  
  const [lessonForm, setLessonForm] = useState({
    title: "",
    lesson_type: 'video' as LessonType,
    is_preview: false,
  });

  const handleAddSection = () => {
    if (!sectionForm.title.trim()) {
      toast.error("Section title is required");
      return;
    }

    const newSection = {
      id: `section-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      title: sectionForm.title.trim(),
      description: sectionForm.description.trim(),
      lessons: [],
    };

    const updatedSections = [...sections, newSection];
    setSections(updatedSections);
    updateCourseData({ sections: updatedSections });
    
    setSectionForm({ title: "", description: "" });
    setIsAddingSectionDialogOpen(false);
    toast.success("Section added successfully");
  };

  const handleEditSection = (index: number) => {
    const section = sections[index];
    setEditingSection({ ...section, index });
    setSectionForm({
      title: section.title,
      description: section.description || "",
    });
    setIsAddingSectionDialogOpen(true);
  };

  const handleUpdateSection = () => {
    if (!sectionForm.title.trim() || editingSection === null) {
      toast.error("Section title is required");
      return;
    }

    const updatedSections = [...sections];
    updatedSections[editingSection.index] = {
      ...updatedSections[editingSection.index],
      title: sectionForm.title.trim(),
      description: sectionForm.description.trim(),
    };

    setSections(updatedSections);
    updateCourseData({ sections: updatedSections });
    
    setSectionForm({ title: "", description: "" });
    setEditingSection(null);
    setIsAddingSectionDialogOpen(false);
    toast.success("Section updated successfully");
  };

  const handleDeleteSection = (index: number) => {
    if (!confirm("Are you sure you want to delete this section and all its lessons?")) {
      return;
    }

    const updatedSections = sections.filter((_, i) => i !== index);
    setSections(updatedSections);
    updateCourseData({ sections: updatedSections });
    toast.success("Section deleted successfully");
  };

  const handleAddLesson = () => {
    if (currentSectionIndex === null || !lessonForm.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }

    const newLesson = {
      id: `lesson-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      title: lessonForm.title.trim(),
      lesson_type: lessonForm.lesson_type,
      is_preview: lessonForm.is_preview,
    };

    const updatedSections = [...sections];
    updatedSections[currentSectionIndex].lessons.push(newLesson);
    
    setSections(updatedSections);
    updateCourseData({ sections: updatedSections });
    
    setLessonForm({ title: "", lesson_type: 'video', is_preview: false });
    setIsAddingLessonDialogOpen(false);
    toast.success("Lesson added successfully");
  };

  const handleDeleteLesson = (sectionIndex: number, lessonIndex: number) => {
    if (!confirm("Are you sure you want to delete this lesson?")) {
      return;
    }

    const updatedSections = [...sections];
    updatedSections[sectionIndex].lessons = updatedSections[sectionIndex].lessons.filter((_, i) => i !== lessonIndex);
    
    setSections(updatedSections);
    updateCourseData({ sections: updatedSections });
    toast.success("Lesson deleted successfully");
  };

  const handleContinue = async () => {
    if (sections.length === 0) {
      toast.error("Please add at least one section");
      return;
    }

    const totalLessons = sections.reduce((sum, section) => sum + section.lessons.length, 0);
    if (totalLessons < 3) {
      toast.error("Please add at least 3 lessons across all sections");
      return;
    }

    if (!courseData.courseId) {
      toast.error("Course ID not found. Please complete Step 1 first.");
      return;
    }

    // Save sections and lessons to database
    try {
      const { createSection } = await import("@/server/actions/instructor.actions");
      
      // Save each section with its lessons
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        const sectionResult = await createSection({
          course_id: courseData.courseId,
          title: section.title,
          description: section.description,
          order_index: i,
        });

        if (sectionResult.success && sectionResult.data) {
          // Save lessons for this section
          const { addLesson } = await import("@/server/actions/instructor.actions");
          
          for (let j = 0; j < section.lessons.length; j++) {
            const lesson = section.lessons[j];
            await addLesson({
              course_id: courseData.courseId!,
              section_id: sectionResult.data.id,
              title: lesson.title,
              lesson_type: lesson.lesson_type,
              is_preview: lesson.is_preview,
              order_index: j,
            });
          }
        }
      }

      toast.success("Curriculum saved successfully!");
      updateCourseData({ sections });
      onNext();
    } catch (error) {
      console.error("Error saving curriculum:", error);
      toast.error("Failed to save curriculum. Please try again.");
    }
  };

  const totalLessons = sections.reduce((sum, section) => sum + section.lessons.length, 0);

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Structure your course into logical sections and lessons. You&apos;ll upload content for each lesson in the next step.
          <strong> Minimum: 1 section, 3 lessons total.</strong>
        </AlertDescription>
      </Alert>

      {/* Summary Stats */}
      <div className="flex gap-4">
        <Card className="p-4 flex-1">
          <div className="text-sm text-muted-foreground">Sections</div>
          <div className="text-2xl font-bold">{sections.length}</div>
        </Card>
        <Card className="p-4 flex-1">
          <div className="text-sm text-muted-foreground">Total Lessons</div>
          <div className="text-2xl font-bold">{totalLessons}</div>
        </Card>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {sections.map((section, sectionIndex) => (
          <Card key={section.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  <div>
                    <h3 className="font-semibold text-lg">Section {sectionIndex + 1}: {section.title}</h3>
                    {section.description && (
                      <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditSection(sectionIndex)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteSection(sectionIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Lessons in Section */}
            <div className="ml-8 space-y-2">
              {section.lessons.map((lesson: { id: string; title: string; lesson_type: LessonType; is_preview: boolean }, lessonIndex: number) => {
                const LessonIcon = LESSON_TYPES.find(t => t.value === lesson.lesson_type)?.icon || Video;
                return (
                  <div key={lesson.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <LessonIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{lesson.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {LESSON_TYPES.find(t => t.value === lesson.lesson_type)?.label}
                      </Badge>
                      {lesson.is_preview && (
                        <Badge variant="outline" className="text-xs">Free Preview</Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteLesson(sectionIndex, lessonIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentSectionIndex(sectionIndex);
                  setIsAddingLessonDialogOpen(true);
                }}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Lesson to Section {sectionIndex + 1}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Section Button */}
      <Dialog open={isAddingSectionDialogOpen} onOpenChange={(open) => {
        setIsAddingSectionDialogOpen(open);
        if (!open) {
          setSectionForm({ title: "", description: "" });
          setEditingSection(null);
        }
      }}>
        <DialogTrigger asChild>
          <Button className="w-full" size="lg">
            <PlusCircle className="h-5 w-5 mr-2" />
            Add New Section
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSection ? "Edit Section" : "Add New Section"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="section-title">Section Title *</Label>
              <Input
                id="section-title"
                value={sectionForm.title}
                onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                placeholder="e.g., Introduction to React"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-description">Description (Optional)</Label>
              <Textarea
                id="section-description"
                value={sectionForm.description}
                onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                placeholder="Brief description of what this section covers"
                rows={3}
              />
            </div>
            <Button 
              onClick={editingSection ? handleUpdateSection : handleAddSection}
              className="w-full"
            >
              {editingSection ? "Update Section" : "Add Section"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Lesson Dialog */}
      <Dialog open={isAddingLessonDialogOpen} onOpenChange={setIsAddingLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Lesson Title *</Label>
              <Input
                id="lesson-title"
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                placeholder="e.g., Understanding React Components"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-type">Lesson Type</Label>
              <Select
                value={lessonForm.lesson_type}
                onValueChange={(value: LessonType) => setLessonForm({ ...lessonForm, lesson_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LESSON_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 space-y-2">
              <input
                type="checkbox"
                id="is-preview"
                checked={lessonForm.is_preview}
                onChange={(e) => setLessonForm({ ...lessonForm, is_preview: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="is-preview" className="cursor-pointer">
                Make this a free preview lesson
              </Label>
            </div>
            <Button onClick={handleAddLesson} className="w-full">
              Add Lesson
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save & Continue Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button
          onClick={handleContinue}
          disabled={sections.length === 0 || totalLessons < 3}
          className="min-w-[200px]"
        >
          Save & Continue
        </Button>
      </div>
    </div>
  );
}
