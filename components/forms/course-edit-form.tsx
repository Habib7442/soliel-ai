"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor"),
  { ssr: false }
);

interface Course {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  level: string;
  language: string | null;
  price_cents: number;
}

interface CourseEditFormProps {
  course: Course;
}

export const CourseEditForm = ({ course }: CourseEditFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: course.title,
    subtitle: course.subtitle || "",
    description: course.description || "",
    level: course.level,
    language: course.language || "english",
    price: course.price_cents > 0 ? (course.price_cents / 100).toFixed(2) : "0.00",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          subtitle: formData.subtitle.trim(),
          description: formData.description.trim(),
          level: formData.level,
          language: formData.language,
          price_cents: Math.round(parseFloat(formData.price) * 100),
        }),
      });

      if (response.ok) {
        toast.success("Course updated successfully!");
        router.push(`/instructor/courses/${course.id}`);
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update course");
      }
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Failed to update course. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="mb-2 block">Course Title *</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter course title"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="subtitle" className="mb-2 block">Short Description *</Label>
        <Input
          id="subtitle"
          name="subtitle"
          value={formData.subtitle}
          onChange={handleChange}
          placeholder="Enter course subtitle"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description" className="mb-2 block">Full Description *</Label>
        <div data-color-mode="dark">
          <MDEditor
            value={formData.description}
            onChange={(value) => setFormData(prev => ({ ...prev, description: value || "" }))}
            preview="edit"
            height={400}
            visibleDragbar={false}
            textareaProps={{
              placeholder: "Enter detailed course description using Markdown...\n\nExample:\n# Course Overview\n\n## What you'll learn\n- Point 1\n- Point 2\n\n**Important:** Use formatting for better structure"
            }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Use Markdown to format your description with headings, lists, bold, italic, etc.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="level" className="mb-2 block">Difficulty Level</Label>
          <Select 
            name="level" 
            value={formData.level}
            onValueChange={(value) => handleSelectChange("level", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="language" className="mb-2 block">Language</Label>
          <Select 
            name="language" 
            value={formData.language}
            onValueChange={(value) => handleSelectChange("language", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="hindi">Hindi</SelectItem>
              <SelectItem value="spanish">Spanish</SelectItem>
              <SelectItem value="french">French</SelectItem>
              <SelectItem value="german">German</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="price" className="mb-2 block">Price (USD)</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={handleChange}
          placeholder="Enter course price in USD"
          required
        />
        <p className="text-sm text-muted-foreground mt-1">
          Set to 0 for a free course
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push(`/instructor/courses/${course.id}`)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Course"}
        </Button>
      </div>
    </form>
  );
};
