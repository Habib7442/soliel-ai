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
  Upload
} from "lucide-react";
import { toast } from "sonner";
import {
  getAdminBundles,
  createBundle,
  updateBundle,
  deleteBundle,
} from "@/server/actions/bundle.actions";
import { getAllCoursesForAdmin } from "@/server/actions/admin.actions";
import { createClient } from "@/lib/supabase-client";

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

export default function AdminBundlesClient() {
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
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bundlesResult, coursesResult] = await Promise.all([
        getAdminBundles(),
        getAllCoursesForAdmin(),
      ]);

      if (bundlesResult.success) {
        setBundles(bundlesResult.data || []);
      }

      if (coursesResult.success) {
        // Only show published courses and map to Course interface
        const publishedCourses = (coursesResult.data || []).filter(
          (c) => c.is_published
        ).map((c) => ({
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Bundle Management</h1>
            <p className="text-muted-foreground">
              Create and manage course bundles with automatic discount pricing
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => handleOpenDialog()}
                className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Bundle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingBundle ? "Edit Bundle" : "Create New Bundle"}
                  </DialogTitle>
                  <DialogDescription>
                    Bundle 2+ courses together. Automatic discounts: 2 courses = 10% off, 3+ courses = 20% off
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-6">
                  {/* Bundle Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Bundle Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Web Development Complete Pack"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what this bundle offers..."
                      rows={3}
                    />
                  </div>

                  {/* Cover Image */}
                  <div className="space-y-2">
                    <Label>Cover Image</Label>
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
                          className="flex-1"
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
                          <span className="bg-background px-2 text-muted-foreground">Or use URL</span>
                        </div>
                      </div>
                      <Input
                        id="cover_url"
                        value={formData.cover_url}
                        onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        type="url"
                      />
                      {/* Image Preview */}
                      {formData.cover_url && (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border">
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
                      <Label>Discount Percentage</Label>
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
                        />
                        <p className="text-xs text-muted-foreground">
                          Custom discount: {formData.custom_discount || 0}% off
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Auto: {discountPercent}% off (2 courses = 10%, 3+ = 20%)
                      </p>
                    )}
                  </div>

                  {/* Course Selection */}
                  <div className="space-y-3">
                    <Label>Select Courses * (minimum 2)</Label>
                    {courses.length === 0 ? (
                      <div className="text-sm text-muted-foreground flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        No published courses available. Publish some courses first.
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
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
                              <div className="font-medium">{course.title}</div>
                              <div className="text-sm text-muted-foreground">
                                ${(course.price_cents / 100).toFixed(2)} • {course.level}
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pricing Preview */}
                  {formData.course_ids.length > 0 && (
                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-lg">Pricing Preview</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span>Selected Courses:</span>
                          <span className="font-semibold">{formData.course_ids.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Original Total:</span>
                          <span>${(originalTotal / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>Discount ({discountPercent}%):</span>
                          <span>-${(discountAmount / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t">
                          <span>Bundle Price:</span>
                          <span className="text-[#FF6B35]">
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
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting || formData.course_ids.length < 2}
                    className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D]"
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Bundles</p>
                  <p className="text-2xl font-bold">{bundles.length}</p>
                </div>
                <Package className="w-8 h-8 text-[#FF6B35]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Bundles</p>
                  <p className="text-2xl font-bold">
                    {bundles.filter((b) => b.is_active).length}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Courses</p>
                  <p className="text-2xl font-bold">{courses.length}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Discount</p>
                  <p className="text-2xl font-bold">
                    {bundles.length > 0
                      ? Math.round(
                          bundles.reduce((sum, b) => sum + (b.discount_percent || 0), 0) /
                            bundles.length
                        )
                      : 0}
                    %
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bundles Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Bundles</CardTitle>
            <CardDescription>
              Manage your course bundles and their pricing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bundles.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No bundles yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first bundle to offer discounted course packages
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Bundle
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bundle Name</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bundles.map((bundle) => (
                    <TableRow key={bundle.id}>
                      <TableCell className="font-medium">{bundle.name}</TableCell>
                      <TableCell>
                        {bundle.bundle_courses?.length || 0} courses
                      </TableCell>
                      <TableCell>
                        ${(bundle.price_cents / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{bundle.discount_percent}% off</Badge>
                      </TableCell>
                      <TableCell>
                        {bundle.is_active ? (
                          <Badge className="bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(bundle)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(bundle.id, bundle.name)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
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
