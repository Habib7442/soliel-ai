"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { createCourse } from "@/server/actions/instructor.actions";

interface CourseCreateFormProps {
  instructorId: string;
}

export function CourseCreateForm({ instructorId }: CourseCreateFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    level: "beginner",
    language: "en",
    price: "0",
    category: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      // Validate required fields
      if (!formData.title.trim()) {
        toast.error("Course title is required");
        setIsSubmitting(false);
        return;
      }

      if (!formData.subtitle.trim()) {
        toast.error("Short description is required");
        setIsSubmitting(false);
        return;
      }

      if (!formData.description.trim()) {
        toast.error("Full description is required");
        setIsSubmitting(false);
        return;
      }

      if (!formData.category.trim()) {
        toast.error("Please enter a category name");
        setIsSubmitting(false);
        return;
      }

      // Create course
      const result = await createCourse({
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        description: formData.description.trim(),
        level: formData.level,
        language: formData.language,
        price_cents: Math.round(parseFloat(formData.price) * 100) || 0,
        currency: 'INR',
        instructor_id: instructorId,
        category_name: formData.category.trim()
      });

      if (result.success) {
        toast.success("Course created successfully!");
        // Reset form
        setFormData({
          title: "",
          subtitle: "",
          description: "",
          level: "beginner",
          language: "en",
          price: "0",
          category: "",
        });
      } else {
        toast.error("Failed to create course", {
          description: result.error
        });
      }
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error("Failed to create course. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-2">
          <Label htmlFor="title" className="mb-2 block">Course Title *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter course title"
            required
            maxLength={100}
          />
          <p className="text-sm text-muted-foreground mt-1">
            A compelling title that captures the essence of your course
          </p>
        </div>

        <div className="col-span-2">
          <Label htmlFor="subtitle" className="mb-2 block">Short Description *</Label>
          <Textarea
            id="subtitle"
            name="subtitle"
            value={formData.subtitle}
            onChange={handleChange}
            placeholder="Enter a brief description (max 200 characters)"
            required
            maxLength={200}
            rows={2}
          />
          <p className="text-sm text-muted-foreground mt-1">
            This appears on course cards and search results
          </p>
        </div>

        <div className="col-span-2">
          <Label htmlFor="description" className="mb-2 block">Full Description *</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter detailed course description"
            required
            rows={6}
          />
          <p className="text-sm text-muted-foreground mt-1">
            A comprehensive overview of what students will learn
          </p>
        </div>

        <div>
          <Label htmlFor="category" className="mb-2 block">Category *</Label>
          <Input
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="Enter category name"
            required
          />
          <p className="text-sm text-muted-foreground mt-1">
            Enter a category for your course (e.g., Web Development, Data Science)
          </p>
        </div>

        <div>
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

        <div>
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
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="hi">Hindi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="price" className="mb-2 block">Price (INR)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Set to 0 for a free course
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Course"}
        </Button>
      </div>
    </form>
  );
}