"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { addLesson } from "@/server/actions/instructor.actions";

interface LessonCreateFormProps {
  courseId: string;
  onLessonAdded?: () => void;
}

export function LessonCreateForm({ courseId, onLessonAdded }: LessonCreateFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    content_md: "",
    video_url: "",
    downloadable: false,
    lessonType: "text",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        toast.error("Lesson title is required");
        setIsSubmitting(false);
        return;
      }

      // Create lesson
      const result = await addLesson({
        course_id: courseId,
        title: formData.title.trim(),
        content_md: formData.content_md.trim() || undefined,
        video_url: formData.video_url.trim() || undefined,
        downloadable: formData.downloadable,
      });

      if (result.success) {
        toast.success("Lesson created successfully!");
        // Reset form
        setFormData({
          title: "",
          content_md: "",
          video_url: "",
          downloadable: false,
          lessonType: "text",
        });
        // Notify parent component
        if (onLessonAdded) {
          onLessonAdded();
        }
      } else {
        toast.error("Failed to create lesson", {
          description: result.error
        });
      }
    } catch (error) {
      console.error("Error creating lesson:", error);
      toast.error("Failed to create lesson. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title" className="mb-2 block">Lesson Title *</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter lesson title"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="lessonType" className="mb-2 block">Lesson Type</Label>
        <Select 
          name="lessonType" 
          value={formData.lessonType}
          onValueChange={(value) => handleSelectChange("lessonType", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text Lesson</SelectItem>
            <SelectItem value="video">Video Lesson</SelectItem>
            <SelectItem value="pdf">PDF Lesson</SelectItem>
            <SelectItem value="quiz">Quiz</SelectItem>
            <SelectItem value="assignment">Assignment</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {formData.lessonType === "text" && (
        <div>
          <Label htmlFor="content_md" className="mb-2 block">Content</Label>
          <Textarea
            id="content_md"
            name="content_md"
            value={formData.content_md}
            onChange={handleChange}
            placeholder="Enter lesson content (Markdown supported)"
            rows={6}
          />
        </div>
      )}
      
      {formData.lessonType === "video" && (
        <div>
          <Label htmlFor="video_url" className="mb-2 block">Video URL</Label>
          <Input
            id="video_url"
            name="video_url"
            value={formData.video_url}
            onChange={handleChange}
            placeholder="Enter video URL (YouTube, Vimeo, or direct link)"
          />
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        <input
          id="downloadable"
          name="downloadable"
          type="checkbox"
          checked={formData.downloadable}
          onChange={handleCheckboxChange}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <Label htmlFor="downloadable">Allow students to download this lesson</Label>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Lesson"}
        </Button>
      </div>
    </form>
  );
}