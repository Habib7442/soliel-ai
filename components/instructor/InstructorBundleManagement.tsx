"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, 
  Pencil, 
  Trash2, 
  Package, 
  DollarSign, 
  BookOpen, 
  TrendingDown,
  Loader2,
  AlertCircle,
  Upload,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import {
  getInstructorBundles,
  createBundle,
  updateBundle,
  deleteBundle,
} from "@/server/actions/bundle.actions";
import { getInstructorCourses } from "@/server/actions/instructor.actions";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";

interface BundleFormData {
  name: string;
  description: string;
  cover_url: string;
  course_ids: string[];
  custom_discount?: number;
}

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  cover_url?: string | null;
  price_cents: number;
  discount_percent: number;
  is_active: boolean;
  bundle_courses?: Array<{ course_id: string; courses?: { id: string; title: string; price_cents: number } }>;
}

interface Course {
  id: string;
  title: string;
  price_cents: number;
  level?: string;
  is_published: boolean;
}

interface InstructorBundleManagementProps {
  userId: string;
}

export default function InstructorBundleManagement({ userId }: InstructorBundleManagementProps) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [useCustomDiscount, setUseCustomDiscount] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<BundleFormData>({
    name: "",
    description: "",
    cover_url: "",
    course_ids: [],
    custom_discount: undefined,
  });

  // Load bundles and courses
  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bundlesResult, coursesResult] = await Promise.all([
        getInstructorBundles(userId),
        getInstructorCourses(userId),
      ]);

      if (bundlesResult.success) {
        setBundles(bundlesResult.data || []);
      }

      if (coursesResult.success) {
        // Only show published courses and map to Course interface
        const publishedCourses = (coursesResult.data || []).filter(
          (c: any) => c.is_published
        ).map((c: any) => ({
          id: c.id,
          title: c.title,
          price_cents: c.price_cents,
          is_published: c.is_published,
        }));
        setCourses(publishedCourses);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (bundle?: Bundle) => {
    if (bundle) {
      setEditingBundle(bundle);
      setFormData({
        name: bundle.name,
        description: bundle.description || "",
        cover_url: bundle.cover_url || "",
        course_ids: bundle.bundle_courses?.map((bc) => bc.course_id) || [],
        custom_discount: bundle.discount_percent || undefined,
      });
      // Check if it has custom discount
      const autoDiscount = (bundle.bundle_courses?.length || 0) >= 3 ? 20 : (bundle.bundle_courses?.length || 0) >= 2 ? 10 : 0;
      setUseCustomDiscount(bundle.discount_percent !== autoDiscount);
    } else {
      setEditingBundle(null);
      setFormData({
        name: "",
        description: "",
        cover_url: "",
        course_ids: [],
        custom_discount: undefined,
      });
      setUseCustomDiscount(false);
    }
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `bundle-${Date.now()}.${fileExt}`;
      const filePath = `bundles/${fileName}`;

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from("course-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("course-assets")
        .getPublicUrl(filePath);

      setFormData({ ...formData, cover_url: publicUrl });
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Bundle name is required");
      return;
    }

    if (formData.course_ids.length < 2) {
      toast.error("Select at least 2 courses for the bundle");
      return;
    }

    setSubmitting(true);

    try {
      if (editingBundle) {
        // Update existing bundle
        const result = await updateBundle(editingBundle.id, {
          name: formData.name,
          description: formData.description,
          cover_url: formData.cover_url,
          courseIds: formData.course_ids,
          customDiscount: useCustomDiscount ? formData.custom_discount : undefined,
        });

        if (result.success) {
          toast.success("Bundle updated successfully!");
          setDialogOpen(false);
          loadData();
        } else {
          toast.error(result.error || "Failed to update bundle");
        }
      } else {
        // Create new bundle
        const result = await createBundle(
          formData.name,
          formData.description,
          formData.course_ids,
          formData.cover_url,
          useCustomDiscount ? formData.custom_discount : undefined
        );

        if (result.success) {
          toast.success("Bundle created successfully!");
          setDialogOpen(false);
          loadData();
        } else {
          toast.error(result.error || "Failed to create bundle");
        }
      }
    } catch (error) {
      console.error("Error submitting bundle:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (bundleId: string, bundleName: string) => {
    if (!confirm(`Are you sure you want to delete "${bundleName}"? This will deactivate the bundle.`)) {
      return;
    }

    try {
      const result = await deleteBundle(bundleId);

      if (result.success) {
        toast.success("Bundle deleted successfully");
        loadData();
      } else {
        toast.error(result.error || "Failed to delete bundle");
      }
    } catch (error) {
      console.error("Error deleting bundle:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setFormData((prev) => ({
      ...prev,
      course_ids: prev.course_ids.includes(courseId)
        ? prev.course_ids.filter((id) => id !== courseId)
        : [...prev.course_ids, courseId],
    }));
  };

  // Calculate pricing preview
  const selectedCourses = courses.filter((c) => formData.course_ids.includes(c.id));
  const originalTotal = selectedCourses.reduce((sum, c) => sum + c.price_cents, 0);
  const autoDiscountPercent = formData.course_ids.length >= 3 ? 20 : formData.course_ids.length >= 2 ? 10 : 0;
  const discountPercent = useCustomDiscount && formData.custom_discount !== undefined ? formData.custom_discount : autoDiscountPercent;
  const discountAmount = Math.round((originalTotal * discountPercent) / 100);
  const bundlePrice = originalTotal - discountAmount;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        <div className="mb-8">
             <Button variant="ghost" size="sm" asChild className="rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all font-bold">
                <Link href="/instructor-dashboard">
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Back to Dashboard
                </Link>
             </Button>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-2">My Bundles</h1>
            <p className="text-muted-foreground font-medium">
              Create and manage course bundles to boost your sales
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => handleOpenDialog()}
                className="rounded-2xl bg-gray-900 hover:bg-primary text-white h-12 px-6 shadow-xl shadow-black/10 transition-all font-bold tracking-tight active:scale-95 border-0"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Bundle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">
                    {editingBundle ? "Edit Bundle" : "Create New Bundle"}
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    Bundle 2+ courses together. Automatic discounts: 2 courses = 10% off, 3+ courses = 20% off
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-6">
                  {/* Bundle Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-bold">Bundle Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Web Development Complete Pack"
                      required
                      className="rounded-xl h-12"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="font-bold">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what this bundle offers..."
                      rows={3}
                      className="rounded-xl resize-none"
                    />
                  </div>

                  {/* Cover Image */}
                  <div className="space-y-2">
                    <Label className="font-bold">Cover Image</Label>
                    <div className="space-y-3">
                      {/* File Upload */}
                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="flex-1 rounded-xl h-12"
                        >
                          {uploadingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Image
                            </>
                          )}
                        </Button>
                      </div>
                      {/* Or URL Input */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground font-bold">Or use URL</span>
                        </div>
                      </div>
                      <Input
                        id="cover_url"
                        value={formData.cover_url}
                        onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        type="url"
                        className="rounded-xl h-12"
                      />
                      {/* Image Preview */}
                      {formData.cover_url && (
                        <div className="relative w-full h-32 rounded-xl overflow-hidden border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formData.cover_url}
                            alt="Bundle cover preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://placehold.co/600x400?text=Invalid+Image";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Custom Discount */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold">Discount Percentage</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUseCustomDiscount(!useCustomDiscount);
                          if (useCustomDiscount) {
                            setFormData({ ...formData, custom_discount: undefined });
                          }
                        }}
                        className="text-primary hover:text-primary/80 font-bold"
                      >
                        {useCustomDiscount ? "Use Auto" : "Set Custom"}
                      </Button>
                    </div>
                    {useCustomDiscount ? (
                      <div className="space-y-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.custom_discount || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              custom_discount: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="Enter discount % (0-100)"
                          className="rounded-xl h-12"
                        />
                        <p className="text-xs text-muted-foreground font-medium">
                          Custom discount: {formData.custom_discount || 0}% off
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground font-medium">
                        Auto: {discountPercent}% off (2 courses = 10%, 3+ = 20%)
                      </p>
                    )}
                  </div>

                  {/* Course Selection */}
                  <div className="space-y-3">
                    <Label className="font-bold">Select Courses * (minimum 2)</Label>
                    {courses.length === 0 ? (
                      <div className="text-sm text-muted-foreground flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl font-medium">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        No published courses available. Publish some courses first.
                      </div>
                    ) : (
                      <div className="border rounded-xl p-4 space-y-3 max-h-64 overflow-y-auto">
                        {courses.map((course) => (
                          <div key={course.id} className="flex items-start gap-3">
                            <Checkbox
                              id={`course-${course.id}`}
                              checked={formData.course_ids.includes(course.id)}
                              onCheckedChange={() => toggleCourseSelection(course.id)}
                            />
                            <label
                              htmlFor={`course-${course.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="font-bold">{course.title}</div>
                              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                ${(course.price_cents / 100).toFixed(0)} • {course.level || "ALL LEVELS"}
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pricing Preview */}
                  {formData.course_ids.length > 0 && (
                    <Card className="bg-muted/30 border-0 shadow-none rounded-xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold">Pricing Preview</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Selected Courses:</span>
                          <span className="font-bold">{formData.course_ids.length}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Original Total:</span>
                          <span>${(originalTotal / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium text-green-600 dark:text-green-400">
                          <span>Discount ({discountPercent}%):</span>
                          <span>-${(discountAmount / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-black pt-3 border-t border-gray-200/50 mt-2">
                          <span>Bundle Price:</span>
                          <span className="text-primary">
                            ${(bundlePrice / 100).toFixed(2)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    disabled={submitting}
                    className="rounded-xl h-12 font-bold"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting || formData.course_ids.length < 2}
                    className="bg-gray-900 hover:bg-primary text-white rounded-xl h-12 font-bold shadow-lg shadow-black/5"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>{editingBundle ? "Update Bundle" : "Create Bundle"}</>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-[2rem] border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="pt-8 pb-8 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Bundles</p>
                  <p className="text-3xl font-black text-gray-900">{bundles.length}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                   <Package className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="pt-8 pb-8 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Active Bundles</p>
                  <p className="text-3xl font-black text-gray-900">
                    {bundles.filter((b) => b.is_active).length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                   <TrendingDown className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="pt-8 pb-8 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Available Courses</p>
                  <p className="text-3xl font-black text-gray-900">{courses.length}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                   <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="pt-8 pb-8 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Avg Discount</p>
                  <p className="text-3xl font-black text-gray-900">
                    {bundles.length > 0
                      ? Math.round(
                          bundles.reduce((sum, b) => sum + (b.discount_percent || 0), 0) /
                            bundles.length
                        )
                      : 0}
                    %
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                   <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bundles Table */}
        <Card className="border-0 shadow-sm rounded-[2.5rem] overflow-hidden bg-white/70 backdrop-blur-xl">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-2xl font-black tracking-tight">All Bundles</CardTitle>
            <CardDescription className="text-base font-medium">
              Manage your course bundles and their pricing
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {bundles.length === 0 ? (
              <div className="text-center py-24">
                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                   <Package className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-bold mb-2">No bundles yet</h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  Create your first bundle to offer discounted course packages to your students.
                </p>
                <Button onClick={() => handleOpenDialog()} className="rounded-2xl h-14 px-8 font-bold bg-primary hover:bg-primary/90">
                  <Plus className="w-5 h-5 mr-2" />
                  Create First Bundle
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-gray-100">
                    <TableHead className="pl-8 h-14 font-bold text-xs uppercase tracking-wider text-gray-400">Bundle Name</TableHead>
                    <TableHead className="h-14 font-bold text-xs uppercase tracking-wider text-gray-400">Courses</TableHead>
                    <TableHead className="h-14 font-bold text-xs uppercase tracking-wider text-gray-400">Price</TableHead>
                    <TableHead className="h-14 font-bold text-xs uppercase tracking-wider text-gray-400">Discount</TableHead>
                    <TableHead className="h-14 font-bold text-xs uppercase tracking-wider text-gray-400">Status</TableHead>
                    <TableHead className="pr-8 text-right h-14 font-bold text-xs uppercase tracking-wider text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bundles.map((bundle) => (
                    <TableRow key={bundle.id} className="hover:bg-white/50 border-gray-50 transition-colors">
                      <TableCell className="pl-8 font-bold text-gray-900">{bundle.name}</TableCell>
                      <TableCell className="font-medium text-muted-foreground">
                        {bundle.bundle_courses?.length || 0} courses
                      </TableCell>
                      <TableCell className="font-black text-gray-900">
                        ${(bundle.price_cents / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-lg font-bold border-gray-200 text-gray-600 bg-white">{bundle.discount_percent}% off</Badge>
                      </TableCell>
                      <TableCell>
                        {bundle.is_active ? (
                          <Badge className="bg-green-500 hover:bg-green-600 rounded-lg text-white border-0 font-bold tracking-wide text-[10px] uppercase">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-lg font-bold">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl h-9 w-9 text-gray-400 hover:text-primary hover:bg-primary/5"
                            onClick={() => handleOpenDialog(bundle)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(bundle.id, bundle.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
