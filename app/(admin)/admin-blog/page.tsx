"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Upload,
  X,
  Tag,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  publishBlog,
  unpublishBlog,
  archiveBlog,
  getAllBlogCategories,
  createBlogCategory,
} from "@/server/actions/blog.actions";
import type { Blog, BlogCategory, BlogWithCategories } from "@/types/db";
import { useSupabase } from "@/providers/supabase-provider";
import { createClient } from "@/lib/supabase-client";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

// Dynamically import the Markdown editor to avoid SSR issues
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

export default function AdminBlogPage() {
  const { user } = useSupabase();
  const [blogs, setBlogs] = useState<BlogWithCategories[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogWithCategories | null>(null);
  const [deletingBlogId, setDeletingBlogId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    content: "",
    excerpt: "",
    featured_image_url: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    og_title: "",
    og_description: "",
    og_image_url: "",
    status: "draft" as "draft" | "published" | "archived",
    category_ids: [] as string[],
  });

  // Category form
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, []);

  const fetchBlogs = async () => {
    const result = await getAllBlogs();
    if (result.success && result.data) {
      setBlogs(result.data);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const result = await getAllBlogCategories();
    if (result.success && result.data) {
      setCategories(result.data);
    }
  };

  const handleOpenDialog = (blog?: BlogWithCategories) => {
    if (blog) {
      setEditingBlog(blog);
      setFormData({
        title: blog.title,
        subtitle: blog.subtitle || "",
        content: blog.content,
        excerpt: blog.excerpt || "",
        featured_image_url: blog.featured_image_url || "",
        meta_title: blog.meta_title || "",
        meta_description: blog.meta_description || "",
        meta_keywords: blog.meta_keywords || "",
        og_title: blog.og_title || "",
        og_description: blog.og_description || "",
        og_image_url: blog.og_image_url || "",
        status: blog.status,
        category_ids: blog.blog_category_relations?.map(rel => rel.blog_categories.id) || [],
      });
    } else {
      setEditingBlog(null);
      setFormData({
        title: "",
        subtitle: "",
        content: "",
        excerpt: "",
        featured_image_url: "",
        meta_title: "",
        meta_description: "",
        meta_keywords: "",
        og_title: "",
        og_description: "",
        og_image_url: "",
        status: "draft",
        category_ids: [],
      });
    }
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      const supabase = createClient();
      
      // Check authentication
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast.error("You must be logged in to upload images");
        setUploadingImage(false);
        return;
      }
      
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;


      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }


      const { data: { publicUrl } } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filePath);


      setFormData(prev => ({ ...prev, featured_image_url: publicUrl }));
      toast.success("Image uploaded successfully");
    } catch (error: unknown) {
      console.error("Error uploading image:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image";
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    try {
      if (editingBlog) {
        const result = await updateBlog(editingBlog.id, formData);
        if (result.success) {
          toast.success("Blog updated successfully");
          fetchBlogs();
          setDialogOpen(false);
        } else {
          toast.error(result.error || "Failed to update blog");
        }
      } else {
        const result = await createBlog({
          ...formData,
          author_id: user.id,
        });
        if (result.success) {
          toast.success("Blog created successfully");
          fetchBlogs();
          setDialogOpen(false);
        } else {
          toast.error(result.error || "Failed to create blog");
        }
      }
    } catch (error) {
      console.error("Error saving blog:", error);
      toast.error("An error occurred");
    }
  };

  const handleDelete = async () => {
    if (!deletingBlogId) return;

    try {
      const result = await deleteBlog(deletingBlogId);
      if (result.success) {
        toast.success("Blog deleted successfully");
        fetchBlogs();
      } else {
        toast.error(result.error || "Failed to delete blog");
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error("An error occurred");
    } finally {
      setDeleteDialogOpen(false);
      setDeletingBlogId(null);
    }
  };

  const handleTogglePublish = async (blog: BlogWithCategories) => {
    try {
      if (blog.status === "published") {
        const result = await unpublishBlog(blog.id);
        if (result.success) {
          toast.success("Blog unpublished");
          fetchBlogs();
        } else {
          toast.error(result.error || "Failed to unpublish");
        }
      } else {
        const result = await publishBlog(blog.id);
        if (result.success) {
          toast.success("Blog published");
          fetchBlogs();
        } else {
          toast.error(result.error || "Failed to publish");
        }
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("An error occurred");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const result = await createBlogCategory(newCategory);
      if (result.success) {
        toast.success("Category created successfully");
        fetchCategories();
        setCategoryDialogOpen(false);
        setNewCategory({ name: "", description: "" });
      } else {
        toast.error(result.error || "Failed to create category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("An error occurred");
    }
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">Blog Management</CardTitle>
              <CardDescription>
                Manage blog posts with full SEO metadata support
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCategoryDialogOpen(true)}
              >
                <Tag className="w-4 h-4 mr-2" />
                Categories
              </Button>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                New Blog Post
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogs.map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell className="font-medium">{blog.title}</TableCell>
                  <TableCell>{blog.profiles?.full_name || "Unknown"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {blog.blog_category_relations?.map((rel) => (
                        <Badge key={rel.blog_categories.id} variant="secondary">
                          {rel.blog_categories.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        blog.status === "published"
                          ? "default"
                          : blog.status === "draft"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {blog.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {blog.published_at
                      ? new Date(blog.published_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(blog)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePublish(blog)}
                        className={
                          blog.status === "published"
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {blog.status === "published" ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingBlogId(blog.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Blog Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden h-full">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {editingBlog ? "Edit Blog Post" : "Create New Blog Post"}
              </DialogTitle>
              <DialogDescription>
                Fill in the blog details with SEO metadata for better discoverability
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6 overflow-y-auto flex-1 px-1">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Basic Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData({ ...formData, excerpt: e.target.value })
                    }
                    rows={2}
                    placeholder="Short summary (used in listings)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <div data-color-mode="dark">
                    <MDEditor
                      value={formData.content}
                      onChange={(value) =>
                        setFormData({ ...formData, content: value || "" })
                      }
                      preview="edit"
                      height={400}
                      visibleDragbar={false}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports Markdown formatting (headings, lists, code blocks, links, images, etc.)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Featured Image</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="flex-1"
                      />
                    </div>
                    {uploadingImage && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading image...</span>
                      </div>
                    )}
                    {formData.featured_image_url && !uploadingImage && (
                      <div className="mt-2 relative inline-block">
                        <img
                          src={formData.featured_image_url}
                          alt="Preview"
                          className="h-32 w-auto rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() =>
                            setFormData({ ...formData, featured_image_url: "" })
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Categories</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select topics to organize your blog post (click to toggle)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Badge
                        key={category.id}
                        variant={
                          formData.category_ids.includes(category.id)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleCategory(category.id)}
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "draft" | "published") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* SEO Metadata */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-lg">SEO Metadata</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) =>
                      setFormData({ ...formData, meta_title: e.target.value })
                    }
                    placeholder="Leave empty to use blog title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) =>
                      setFormData({ ...formData, meta_description: e.target.value })
                    }
                    rows={2}
                    placeholder="SEO description (150-160 characters recommended)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_keywords">Meta Keywords</Label>
                  <Input
                    id="meta_keywords"
                    value={formData.meta_keywords}
                    onChange={(e) =>
                      setFormData({ ...formData, meta_keywords: e.target.value })
                    }
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </div>

              {/* Open Graph */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-lg">Social Sharing (Open Graph)</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="og_title">OG Title</Label>
                  <Input
                    id="og_title"
                    value={formData.og_title}
                    onChange={(e) =>
                      setFormData({ ...formData, og_title: e.target.value })
                    }
                    placeholder="Leave empty to use meta title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_description">OG Description</Label>
                  <Textarea
                    id="og_description"
                    value={formData.og_description}
                    onChange={(e) =>
                      setFormData({ ...formData, og_description: e.target.value })
                    }
                    rows={2}
                    placeholder="Leave empty to use meta description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_image_url">OG Image URL</Label>
                  <Input
                    id="og_image_url"
                    value={formData.og_image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, og_image_url: e.target.value })
                    }
                    placeholder="Leave empty to use featured image"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingBlog ? "Update Blog" : "Create Blog"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Blog Category</DialogTitle>
            <DialogDescription>
              Add a new category for organizing blog posts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category_name">Name *</Label>
              <Input
                id="category_name"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_description">Description</Label>
              <Textarea
                id="category_description"
                value={newCategory.description}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCategoryDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCategory}>Create Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this blog post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
