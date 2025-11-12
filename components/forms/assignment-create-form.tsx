"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createAssignment } from "@/server/actions/instructor.actions";

interface AssignmentCreateFormProps {
  courseId: string;
  lessonId: string;
  onAssignmentCreated?: () => void;
}

export function AssignmentCreateForm({ courseId, lessonId, onAssignmentCreated }: AssignmentCreateFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    instructions: "",
    file_types_allowed: "any",
    max_file_size_mb: 10,
    allow_multiple_files: false,
    grading_scale: "points",
    max_points: 100,
    rubric: "",
    due_date: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
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
        toast.error("Assignment title is required");
        setIsSubmitting(false);
        return;
      }

      if (!formData.instructions.trim()) {
        toast.error("Assignment instructions are required");
        setIsSubmitting(false);
        return;
      }

      // Create assignment
      const result = await createAssignment({
        lesson_id: lessonId,
        title: formData.title.trim(),
        instructions: formData.instructions.trim(),
        file_types_allowed: formData.file_types_allowed,
        max_file_size_mb: formData.max_file_size_mb,
        allow_multiple_files: formData.allow_multiple_files,
        grading_scale: formData.grading_scale,
        max_points: formData.max_points,
        rubric: formData.rubric.trim() || undefined,
        due_date: formData.due_date || undefined,
      });

      if (result.success) {
        toast.success("Assignment created successfully!");
        // Reset form
        setFormData({
          title: "",
          instructions: "",
          file_types_allowed: "any",
          max_file_size_mb: 10,
          allow_multiple_files: false,
          grading_scale: "points",
          max_points: 100,
          rubric: "",
          due_date: "",
        });
        // Notify parent component
        if (onAssignmentCreated) {
          onAssignmentCreated();
        }
      } else {
        toast.error("Failed to create assignment", {
          description: result.error
        });
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error("Failed to create assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title" className="mb-2 block">Assignment Title *</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter assignment title"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="instructions" className="mb-2 block">Assignment Instructions *</Label>
        <Textarea
          id="instructions"
          name="instructions"
          value={formData.instructions}
          onChange={handleChange}
          placeholder="Provide clear instructions for this assignment"
          rows={4}
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="file_types_allowed">Accepted File Types</Label>
          <Select 
            name="file_types_allowed" 
            value={formData.file_types_allowed}
            onValueChange={(value) => handleSelectChange("file_types_allowed", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select file types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF Only</SelectItem>
              <SelectItem value="doc">Documents (DOC, DOCX)</SelectItem>
              <SelectItem value="image">Images (JPG, PNG)</SelectItem>
              <SelectItem value="zip">Archives (ZIP, RAR)</SelectItem>
              <SelectItem value="any">Any File Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="max_file_size_mb">Maximum File Size (MB)</Label>
          <Input
            id="max_file_size_mb"
            name="max_file_size_mb"
            type="number"
            min="1"
            max="100"
            value={formData.max_file_size_mb}
            onChange={handleChange}
            placeholder="10"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="allow_multiple_files"
          name="allow_multiple_files"
          checked={formData.allow_multiple_files}
          onCheckedChange={(checked) => 
            setFormData(prev => ({ ...prev, allow_multiple_files: !!checked }))
          }
        />
        <Label htmlFor="allow_multiple_files">Allow multiple file uploads</Label>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="grading_scale">Grading Scale</Label>
          <Select 
            name="grading_scale" 
            value={formData.grading_scale}
            onValueChange={(value) => handleSelectChange("grading_scale", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select grading scale" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="points">Points (0-100)</SelectItem>
              <SelectItem value="pass-fail">Pass/Fail</SelectItem>
              <SelectItem value="letter">Letter Grade (A-F)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="max_points">Maximum Points</Label>
          <Input
            id="max_points"
            name="max_points"
            type="number"
            min="1"
            value={formData.max_points}
            onChange={handleChange}
            placeholder="100"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="rubric">Grading Rubric (Optional)</Label>
        <Textarea
          id="rubric"
          name="rubric"
          value={formData.rubric}
          onChange={handleChange}
          placeholder="Describe your grading criteria"
          rows={3}
        />
      </div>
      
      <div>
        <Label htmlFor="due_date">Due Date (Optional)</Label>
        <Input
          id="due_date"
          name="due_date"
          type="date"
          value={formData.due_date}
          onChange={handleChange}
        />
      </div>
      
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline">Save Draft</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Assignment"}
        </Button>
      </div>
    </form>
  );
}