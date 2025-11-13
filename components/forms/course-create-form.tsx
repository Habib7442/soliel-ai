"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { createCourse, uploadThumbnail } from "@/server/actions/instructor.actions";
import { createClient } from "@/lib/supabase-client";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor"),
  { ssr: false }
);

interface CourseCreateFormProps {
  instructorId: string;
}

export function CourseCreateForm({ instructorId }: CourseCreateFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    level: "beginner",
    language: "english",
    price: "0",
    category: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadedThumbnailUrl, setUploadedThumbnailUrl] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setThumbnailFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setUploadedThumbnailUrl(null);
    setUploadProgress(0);
  };

  const handleUploadThumbnail = async () => {
    if (!thumbnailFile) {
      toast.error('Please select a thumbnail file first');
      return;
    }

    try {
      setUploadingThumbnail(true);
      setUploadProgress(10);
      
      const supabase = createClient();
      
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      setUploadProgress(20);
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        toast.error('You must be logged in to upload files');
        setUploadingThumbnail(false);
        setUploadProgress(0);
        return;
      }
      
      const fileExt = thumbnailFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      
      setUploadProgress(30);
      
      // Add timeout wrapper
      const uploadPromise = supabase.storage
        .from('course-thumbnails')
        .upload(fileName, thumbnailFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
      );
      
      const { data, error: uploadError } = await Promise.race([
        uploadPromise,
        timeoutPromise
      ]);

      setUploadProgress(70);

      if (uploadError) {
        console.error('Upload error details:', {
          message: uploadError.message,
          name: uploadError.name,
          statusCode: 'statusCode' in uploadError ? uploadError.statusCode : undefined,
          error: 'error' in uploadError ? uploadError.error : undefined,
          cause: uploadError.cause,
          stack: uploadError.stack
        });
        toast.error(`Failed to upload: ${uploadError.message}`);
        setUploadingThumbnail(false);
        setUploadProgress(0);
        return;
      }

      if (!data) {
        console.error('No data returned from upload');
        toast.error('Upload failed: No data returned');
        setUploadingThumbnail(false);
        setUploadProgress(0);
        return;
      }

      setUploadProgress(85);

      const { data: { publicUrl } } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(fileName);
      
      setUploadProgress(100);
      
      setUploadedThumbnailUrl(publicUrl);
      toast.success('Thumbnail uploaded successfully!');
      
      // Small delay to show 100% completion
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error('Thumbnail upload error:', err);
      if (err instanceof Error) {
        console.error('Error details:', {
          message: err.message,
          stack: err.stack
        });
        toast.error(`Upload error: ${err.message}`);
      } else {
        toast.error('Failed to upload thumbnail');
      }
      setUploadProgress(0);
    } finally {
      setUploadingThumbnail(false);
    }
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

      // Upload thumbnail if provided
      const thumbnailUrl = uploadedThumbnailUrl;
      if (thumbnailFile && !uploadedThumbnailUrl) {
        toast.error('Please upload the thumbnail before creating the course');
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
        currency: 'USD',
        instructor_id: instructorId,
        category_name: formData.category.trim(),
        thumbnail_url: thumbnailUrl || undefined
      });

      if (result.success) {
        toast.success("Course created successfully!");
        // Reset form
        setFormData({
          title: "",
          subtitle: "",
          description: "",
          level: "beginner",
          language: "english",
          price: "0",
          category: "",
        });
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setUploadProgress(0);
        setUploadedThumbnailUrl(null);
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
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1 md:col-span-2">
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

        <div className="col-span-1 md:col-span-2">
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

        <div className="col-span-1 md:col-span-2">
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

        <div className="col-span-1">
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

        <div className="col-span-1">
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

        <div className="col-span-1">
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
              <SelectItem value="spanish">Spanish</SelectItem>
              <SelectItem value="french">French</SelectItem>
              <SelectItem value="german">German</SelectItem>
              <SelectItem value="hindi">Hindi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-1">
          <Label htmlFor="price" className="mb-2 block">Price (USD)</Label>
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

        {/* Thumbnail Upload */}
        <div className="col-span-1 md:col-span-2">
          <Label htmlFor="thumbnail" className="mb-2 block">Course Thumbnail (16:9 ratio recommended)</Label>
          {thumbnailPreview ? (
            <div className="space-y-4">
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                <Image
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={removeThumbnail}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                  disabled={uploadingThumbnail}
                >
                  <X className="h-4 w-4" />
                </button>
                {uploadedThumbnailUrl && (
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Uploaded
                  </div>
                )}
              </div>
              
              {!uploadedThumbnailUrl && (
                <Button
                  type="button"
                  onClick={handleUploadThumbnail}
                  disabled={uploadingThumbnail}
                  className="w-full"
                >
                  {uploadingThumbnail ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Uploading... {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Thumbnail
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full aspect-video rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition cursor-pointer">
              <label htmlFor="thumbnail" className="flex flex-col items-center justify-center h-full cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Click to select thumbnail</span>
                <span className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</span>
              </label>
              <input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Recommended size: 1920x1080 pixels (16:9 ratio)
          </p>
          
          {/* Upload Progress */}
          {uploadingThumbnail && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading thumbnail...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <Button 
          type="submit" 
          disabled={isSubmitting || uploadingThumbnail || (!!thumbnailFile && !uploadedThumbnailUrl)} 
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Creating Course..." : "Create Course"}
        </Button>
      </div>
    </form>
  );
}