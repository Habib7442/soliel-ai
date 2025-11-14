"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Video, FileText, HelpCircle, CheckSquare, Code, CheckCircle, Edit2 } from "lucide-react";
import { toast } from "sonner";
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

type LessonContent = {
  video_url?: string;
  content_md?: string;
  pdf_url?: string;
  quiz_data?: {
    questions: Array<{
      question: string;
      type: 'single' | 'multiple' | 'true_false';
      options: string[];
      correct_answers: number[];
    }>;
  };
  assignment_data?: {
    instructions: string;
    file_types: string;
    max_file_size: number;
  };
};

export function Step3ContentUpload({ courseData, updateCourseData, onNext }: StepProps) {
  const [editingLesson, setEditingLesson] = useState<{
    sectionIndex: number;
    lessonIndex: number;
    lesson: CourseData['sections'][0]['lessons'][0];
  } | null>(null);
  const [content, setContent] = useState<LessonContent>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const totalLessons = courseData.sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const completedLessons = courseData.sections.reduce(
    (sum, section) => sum + section.lessons.filter(l => l.content && Object.keys(l.content).length > 0).length,
    0
  );

  const handleEditLesson = (sectionIndex: number, lessonIndex: number) => {
    const lesson = courseData.sections[sectionIndex].lessons[lessonIndex];
    setEditingLesson({ sectionIndex, lessonIndex, lesson });
    setContent((lesson.content as LessonContent) || {});
    setIsDialogOpen(true);
  };

  const handleSaveContent = () => {
    if (!editingLesson) return;

    const { sectionIndex, lessonIndex } = editingLesson;
    const updatedSections = [...courseData.sections];
    updatedSections[sectionIndex].lessons[lessonIndex].content = content;

    updateCourseData({ sections: updatedSections });
    toast.success("Content saved successfully");
    setIsDialogOpen(false);
    setEditingLesson(null);
    setContent({});
  };

  const handleContinue = () => {
    // Allow progression even if not all content is uploaded
    onNext();
  };

  const renderContentEditor = () => {
    if (!editingLesson) return null;

    const { lesson } = editingLesson;

    switch (lesson.lesson_type) {
      case 'video':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video_url">Video URL</Label>
              <Input
                id="video_url"
                value={content.video_url || ""}
                onChange={(e) => setContent({ ...content, video_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=... or upload URL"
              />
              <p className="text-sm text-muted-foreground">
                YouTube, Vimeo, or direct video file URL
              </p>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content_md">Content (Markdown)</Label>
              <Textarea
                id="content_md"
                value={content.content_md || ""}
                onChange={(e) => setContent({ ...content, content_md: e.target.value })}
                placeholder="# Lesson Content\n\nWrite your lesson content here using Markdown..."
                rows={10}
              />
            </div>
          </div>
        );

      case 'pdf':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdf_url">PDF URL</Label>
              <Input
                id="pdf_url"
                value={content.pdf_url || ""}
                onChange={(e) => setContent({ ...content, pdf_url: e.target.value })}
                placeholder="https://... or upload PDF"
              />
              <p className="text-sm text-muted-foreground">
                Direct link to PDF file or upload to storage
              </p>
            </div>
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Full quiz builder coming soon. For now, quizzes will be created via the course management page after publishing.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'assignment':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instructions">Assignment Instructions</Label>
              <Textarea
                id="instructions"
                value={content.assignment_data?.instructions || ""}
                onChange={(e) => setContent({
                  ...content,
                  assignment_data: {
                    ...content.assignment_data,
                    instructions: e.target.value,
                    file_types: content.assignment_data?.file_types || "pdf,docx,zip",
                    max_file_size: content.assignment_data?.max_file_size || 10
                  }
                })}
                placeholder="Describe what students need to do..."
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="file_types">Allowed File Types</Label>
                <Input
                  id="file_types"
                  value={content.assignment_data?.file_types || "pdf,docx,zip"}
                  onChange={(e) => setContent({
                    ...content,
                    assignment_data: {
                      ...content.assignment_data!,
                      file_types: e.target.value
                    }
                  })}
                  placeholder="pdf,docx,zip"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_size">Max File Size (MB)</Label>
                <Input
                  id="max_size"
                  type="number"
                  value={content.assignment_data?.max_file_size || 10}
                  onChange={(e) => setContent({
                    ...content,
                    assignment_data: {
                      ...content.assignment_data!,
                      max_file_size: parseInt(e.target.value) || 10
                    }
                  })}
                />
              </div>
            </div>
          </div>
        );

      case 'lab':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lab_instructions">Lab Instructions</Label>
              <Textarea
                id="lab_instructions"
                value={content.content_md || ""}
                onChange={(e) => setContent({ ...content, content_md: e.target.value })}
                placeholder="Lab setup instructions, starter code, etc..."
                rows={10}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Add content for each lesson. Video lessons can use YouTube/Vimeo URLs. You can skip lessons and add content later from the course management page.
        </AlertDescription>
      </Alert>

      {/* Progress Stats */}
      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Content Progress</p>
            <p className="text-2xl font-bold">
              {completedLessons} / {totalLessons}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Completion</p>
            <p className="text-2xl font-bold">
              {totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0}%
            </p>
          </div>
        </div>
      </Card>

      {/* Lessons Overview */}
      <div className="space-y-4">
        <h3 className="font-semibold">Lessons to Configure ({totalLessons})</h3>
        {courseData.sections.map((section, sectionIndex) => (
          <Card key={section.id} className="p-4">
            <h4 className="font-medium mb-3">Section {sectionIndex + 1}: {section.title}</h4>
            <div className="space-y-2">
              {section.lessons.map((lesson, lessonIndex) => {
                const Icon =
                  lesson.lesson_type === 'video' ? Video :
                  lesson.lesson_type === 'text' ? FileText :
                  lesson.lesson_type === 'pdf' ? FileText :
                  lesson.lesson_type === 'quiz' ? HelpCircle :
                  lesson.lesson_type === 'assignment' ? CheckSquare :
                  Code;

                const hasContent = lesson.content && Object.keys(lesson.content).length > 0;

                return (
                  <div key={lesson.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{lesson.title}</span>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {lesson.lesson_type}
                      </Badge>
                      {hasContent && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditLesson(sectionIndex, lessonIndex)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      {hasContent ? 'Edit' : 'Add'} Content
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Content Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLesson?.lesson.title} - Add Content
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {renderContentEditor()}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveContent} className="flex-1">
                Save Content
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between pt-6 border-t">
        <p className="text-sm text-muted-foreground">
          {completedLessons === totalLessons
            ? "All lessons have content!"
            : "You can add content later from the course management page"}
        </p>
        <Button onClick={handleContinue} className="min-w-[200px]">
          Save & Continue
        </Button>
      </div>
    </div>
  );}
