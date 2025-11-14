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
import { updateCourse } from "@/server/actions/instructor.actions";
import { createClient } from "@/lib/supabase-client";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface StepProps {
  courseData: {
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
  };
  updateCourseData: (data: Partial<StepProps['courseData']>) => void;
  instructorId: string;
  courseId: string;
  onNext: () => void;
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function Step1BasicInfo({ courseData, updateCourseData, courseId, onNext }: StepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(courseData.thumbnail_url || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof StepProps['courseData'], value: string | number | string[] | undefined) => {
    updateCourseData({ [field]: value });
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
      
      const { data, error: uploadError } = await supabase.storage
        .from('course-thumbnails')
        .upload(fileName, thumbnailFile, {
          cacheControl: '3600',
          upsert: false
        });
      
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

  const handleSaveAndContinue = async () => {
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
      const result = await updateCourse(courseId, {
        title: courseData.title.trim(),
        subtitle: courseData.subtitle.trim(),
        description: courseData.description.trim(),
        level: courseData.level,
        language: courseData.language,
        thumbnail_url: courseData.thumbnail_url,
        prerequisites: courseData.prerequisites,
        estimated_duration_hours: courseData.estimated_duration_hours,
        intro_video_url: courseData.intro_video_url,
      });

      if (result.success) {
        toast.success("Basic information updated successfully!");
        onNext();
      } else {
        toast.error(result.error || "Failed to update course");
      }
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Failed to update course");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Update your course&apos;s basic information. Make sure to provide clear and engaging content.
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
            placeholder="e.g., Complete Web Development Bootcamp 2024"
            className={errors.title ? "border-destructive" : ""}
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
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
            placeholder="A brief summary that appears in course cards (max 150 characters)"
            maxLength={150}
            rows={2}
            className={errors.subtitle ? "border-destructive" : ""}
          />
          {errors.subtitle && <p className="text-sm text-destructive">{errors.subtitle}</p>}
          <p className="text-sm text-muted-foreground">{courseData.subtitle?.length || 0}/150 characters</p>
        </div>

        {/* Full Description */}
        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label htmlFor="description" className="mb-2 block">
            Full Description <span className="text-destructive">*</span>
          </Label>
          <div className={errors.description ? "border border-destructive rounded" : ""}>
            <MDEditor
              value={courseData.description}
              onChange={(value) => handleChange('description', value || "")}
              preview="edit"
              height={300}
            />
          </div>
          {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          <p className="text-sm text-muted-foreground">Minimum 50 characters. Supports Markdown formatting.</p>
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
          {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
        </div>

        {/* Difficulty Level */}
        <div className="col-span-1 space-y-2">
          <Label htmlFor="level" className="mb-2 block">Difficulty Level</Label>
          <Select value={courseData.level} onValueChange={(value) => handleChange('level', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
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
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="spanish">Spanish</SelectItem>
              <SelectItem value="french">French</SelectItem>
              <SelectItem value="german">German</SelectItem>
              <SelectItem value="chinese">Chinese</SelectItem>
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
            placeholder="What should students know before taking this course?"
            rows={3}
          />
        </div>

        {/* Intro/Trailer Video URL */}
        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label htmlFor="intro_video" className="mb-2 block">Intro/Trailer Video URL (Optional)</Label>
          <Input
            id="intro_video"
            type="url"
            value={courseData.intro_video_url || ""}
            onChange={(e) => handleChange('intro_video_url', e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
          <p className="text-sm text-muted-foreground">
            YouTube or Vimeo URL for your course preview video
          </p>
        </div>

        {/* Thumbnail Upload */}
        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label className="mb-2 block">Course Thumbnail (16:9 ratio recommended)</Label>
          {thumbnailPreview ? (
            <div className="space-y-4">
              <div className="relative w-full max-w-2xl aspect-video rounded-lg overflow-hidden border">
                <Image
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  fill
                  className="object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeThumbnail}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {thumbnailFile && !courseData.thumbnail_url && (
                <div className="space-y-2">
                  {uploadingThumbnail && (
                    <>
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
                    </>
                  )}
                  <Button
                    onClick={handleUploadThumbnail}
                    disabled={uploadingThumbnail}
                    className="w-full sm:w-auto"
                  >
                    {uploadingThumbnail ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Thumbnail
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <Label htmlFor="thumbnail" className="cursor-pointer text-primary hover:underline">
                  Click to upload thumbnail
                </Label>
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailChange}
                />
                <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save & Continue Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button
          onClick={handleSaveAndContinue}
          disabled={isSubmitting}
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save & Continue"
          )}
        </Button>
      </div>
    </div>
  );
}
