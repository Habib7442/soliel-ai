"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { createCourse } from "@/server/actions/instructor.actions";
import { createClient } from "@/lib/supabase-client";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { CourseData } from "./CourseWizard";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface StepProps {
  courseData: CourseData;
  updateCourseData: (data: Partial<CourseData>) => void;
  instructorId: string;
  onNext: () => void;
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function Step1BasicInfo({ courseData, updateCourseData, instructorId, onNext }: StepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(courseData.thumbnail_url || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof CourseData, value: string | number | string[] | undefined) => {
    updateCourseData({ [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setThumbnailFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    updateCourseData({ thumbnail_url: undefined });
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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      setUploadProgress(20);
      
      if (authError || !user) {
        toast.error('You must be logged in to upload files');
        return;
      }
      
      const fileExt = thumbnailFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      
      setUploadProgress(30);
      
      const uploadPromise = supabase.storage
        .from('course-thumbnails')
        .upload(fileName, thumbnailFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 30000)
      );
      
      const { data, error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]);
      setUploadProgress(70);

      if (uploadError) {
        toast.error(`Failed to upload: ${uploadError.message}`);
        return;
      }

      if (!data) {
        toast.error('Upload failed: No data returned');
        return;
      }

      setUploadProgress(85);

      const { data: { publicUrl } } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(fileName);
      
      setUploadProgress(100);
      
      updateCourseData({ thumbnail_url: publicUrl });
      toast.success('Thumbnail uploaded successfully!');
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error('Thumbnail upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload thumbnail');
      setUploadProgress(0);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!courseData.title?.trim()) {
      newErrors.title = "Course title is required";
    }
    if (!courseData.subtitle?.trim()) {
      newErrors.subtitle = "Short description is required";
    }
    if (!courseData.description?.trim() || courseData.description.length < 50) {
      newErrors.description = "Description must be at least 50 characters";
    }
    if (!courseData.category?.trim()) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (thumbnailFile && !courseData.thumbnail_url) {
      toast.error('Please upload the thumbnail before saving');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createCourse({
        title: courseData.title.trim(),
        subtitle: courseData.subtitle.trim(),
        description: courseData.description.trim(),
        level: courseData.level,
        language: courseData.language,
        price_cents: courseData.price_cents || 0,
        currency: courseData.currency || 'USD',
        instructor_id: instructorId,
        category_name: courseData.category.trim(),
        thumbnail_url: courseData.thumbnail_url,
        prerequisites: courseData.prerequisites,
        estimated_duration_hours: courseData.estimated_duration_hours,
        intro_video_url: courseData.intro_video_url,
      });

      if (result.success && result.data) {
        updateCourseData({ courseId: result.data.id });
        toast.success("Course created successfully! You can now build your curriculum.");
        onNext();
      } else {
        toast.error(result.error || "Failed to create course");
      }
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error("Failed to create course. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Start by entering the basic information about your course. You can save as draft and come back later.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course Title */}
        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label htmlFor="title" className="mb-2 block">
            Course Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={courseData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g., Complete Web Development Bootcamp"
            maxLength={100}
            className={errors.title ? "border-destructive" : ""}
          />
          {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
          <p className="text-sm text-muted-foreground mt-1">
            A compelling title that captures the essence of your course (max 100 characters)
          </p>
        </div>

        {/* Short Description */}
        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label htmlFor="subtitle" className="mb-2 block">
            Short Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="subtitle"
            value={courseData.subtitle}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            placeholder="Enter a brief description (max 200 characters)"
            maxLength={200}
            rows={2}
            className={errors.subtitle ? "border-destructive" : ""}
          />
          {errors.subtitle && <p className="text-sm text-destructive mt-1">{errors.subtitle}</p>}
          <p className="text-sm text-muted-foreground mt-1">
            This appears on course cards and search results
          </p>
        </div>

        {/* Full Description */}
        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label htmlFor="description" className="mb-2 block">
            Full Description <span className="text-destructive">*</span>
          </Label>
          <div data-color-mode="dark" className={errors.description ? "border border-destructive rounded" : ""}>
            <MDEditor
              value={courseData.description}
              onChange={(value) => handleChange('description', value || "")}
              preview="edit"
              height={300}
              visibleDragbar={false}
            />
          </div>
          {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
          <p className="text-sm text-muted-foreground mt-1">
            Use Markdown to format your description (minimum 50 characters)
          </p>
        </div>

        {/* Category */}
        <div className="col-span-1 space-y-2">
          <Label htmlFor="category" className="mb-2 block">
            Category <span className="text-destructive">*</span>
          </Label>
          <Input
            id="category"
            value={courseData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            placeholder="e.g., Web Development"
            className={errors.category ? "border-destructive" : ""}
          />
          {errors.category && <p className="text-sm text-destructive mt-1">{errors.category}</p>}
        </div>

        {/* Difficulty Level */}
        <div className="col-span-1 space-y-2">
          <Label htmlFor="level" className="mb-2 block">Difficulty Level</Label>
          <Select value={courseData.level} onValueChange={(value) => handleChange('level', value)}>
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

        {/* Language */}
        <div className="col-span-1 space-y-2">
          <Label htmlFor="language" className="mb-2 block">Language</Label>
          <Select value={courseData.language} onValueChange={(value) => handleChange('language', value)}>
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

        {/* Estimated Duration */}
        <div className="col-span-1 space-y-2">
          <Label htmlFor="duration" className="mb-2 block">Estimated Duration (hours)</Label>
          <Input
            id="duration"
            type="number"
            value={courseData.estimated_duration_hours || ""}
            onChange={(e) => handleChange('estimated_duration_hours', parseInt(e.target.value) || undefined)}
            placeholder="e.g., 40"
            min="1"
          />
        </div>

        {/* Prerequisites */}
        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label htmlFor="prerequisites" className="mb-2 block">Prerequisites (Optional)</Label>
          <Textarea
            id="prerequisites"
            value={courseData.prerequisites || ""}
            onChange={(e) => handleChange('prerequisites', e.target.value)}
            placeholder="e.g., Basic understanding of HTML and CSS"
            rows={3}
          />
        </div>

        {/* Intro/Trailer Video URL */}
        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label htmlFor="intro_video" className="mb-2 block">Intro/Trailer Video URL (Optional)</Label>
          <Input
            id="intro_video"
            value={courseData.intro_video_url || ""}
            onChange={(e) => handleChange('intro_video_url', e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
          <p className="text-sm text-muted-foreground mt-1">
            YouTube or Vimeo URL for a 2-3 minute course preview
          </p>
        </div>

        {/* Thumbnail Upload */}
        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label className="mb-2 block">Course Thumbnail (16:9 ratio recommended)</Label>
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
                {courseData.thumbnail_url && (
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Uploaded
                  </div>
                )}
              </div>
              
              {!courseData.thumbnail_url && (
                <Button
                  type="button"
                  onClick={handleUploadThumbnail}
                  disabled={uploadingThumbnail}
                  className="w-full"
                >
                  {uploadingThumbnail ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button
          onClick={handleSaveDraft}
          disabled={isSubmitting || uploadingThumbnail || (!!thumbnailFile && !courseData.thumbnail_url)}
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Course...
            </>
          ) : courseData.courseId ? (
            "Update & Continue"
          ) : (
            "Save & Continue"
          )}
        </Button>
      </div>
    </div>
  );
}
