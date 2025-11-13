"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  addLesson, 
  updateLesson, 
  deleteLesson, 
  getCourseLessons 
} from "@/server/actions/instructor.actions";
import { useInstructorStore } from "@/hooks/useInstructorStore";
import { PlusCircle, Edit, Trash2, GripVertical, Video, FileText, Download } from "lucide-react";

interface CurriculumManagerProps {
  courseId: string;
}

export const CurriculumManager = ({ courseId }: CurriculumManagerProps) => {
  const router = useRouter();
  const { lessons, setLessons, setLessonsLoading, lessonsLoading } = useInstructorStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<{
    id: string;
    title: string;
    content_md?: string;
    video_url?: string;
    downloadable: boolean;
    order_index: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content_md: "",
    video_url: "",
    downloadable: false,
    order_index: 0,
  });

  // Fetch lessons on mount
  useEffect(() => {
    const fetchLessons = async () => {
      setLessonsLoading(true);
      const result = await getCourseLessons(courseId);
      if (result.success && result.data) {
        setLessons(result.data);
      }
      setLessonsLoading(false);
    };

    fetchLessons();
  }, [courseId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }

    try {
      if (editingLesson) {
        // Update existing lesson
        const result = await updateLesson(editingLesson.id, formData);
        if (result.success) {
          toast.success("Lesson updated successfully!");
          const updatedLessons = await getCourseLessons(courseId);
          if (updatedLessons.success && updatedLessons.data) {
            setLessons(updatedLessons.data);
          }
        } else {
          toast.error(result.error || "Failed to update lesson");
        }
      } else {
        // Create new lesson
        const result = await addLesson({
          course_id: courseId,
          title: formData.title,
          content_md: formData.content_md,
          video_url: formData.video_url,
          downloadable: formData.downloadable,
          order_index: lessons.length,
        });

        if (result.success) {
          toast.success("Lesson created successfully!");
          const updatedLessons = await getCourseLessons(courseId);
          if (updatedLessons.success && updatedLessons.data) {
            setLessons(updatedLessons.data);
          }
        } else {
          toast.error(result.error || "Failed to create lesson");
        }
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error submitting lesson:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleEdit = (lesson: {
    id: string;
    title: string;
    content_md?: string;
    video_url?: string;
    downloadable: boolean;
    order_index: number;
  }) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      content_md: lesson.content_md || "",
      video_url: lesson.video_url || "",
      downloadable: lesson.downloadable || false,
      order_index: lesson.order_index,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) {
      return;
    }

    const result = await deleteLesson(lessonId);
    if (result.success) {
      toast.success("Lesson deleted successfully!");
      const updatedLessons = await getCourseLessons(courseId);
      if (updatedLessons.success && updatedLessons.data) {
        setLessons(updatedLessons.data);
      }
    } else {
      toast.error(result.error || "Failed to delete lesson");
    }
  };

  const resetForm = () => {
    setEditingLesson(null);
    setFormData({
      title: "",
      content_md: "",
      video_url: "",
      downloadable: false,
      order_index: 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course Curriculum</h2>
          <p className="text-muted-foreground">Manage your course lessons and content</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLesson ? "Edit Lesson" : "Add New Lesson"}</DialogTitle>
              <DialogDescription>
                {editingLesson ? "Update lesson details" : "Create a new lesson for your course"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Lesson Title *</Label>
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
                <Label htmlFor="video_url">Video URL</Label>
                <Input
                  id="video_url"
                  name="video_url"
                  value={formData.video_url}
                  onChange={handleChange}
                  placeholder="https://youtube.com/watch?v=..."
                  type="url"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Paste a YouTube, Vimeo, or other video URL
                </p>
              </div>

              <div>
                <Label htmlFor="content_md">Lesson Content (Markdown)</Label>
                <Textarea
                  id="content_md"
                  name="content_md"
                  value={formData.content_md}
                  onChange={handleChange}
                  placeholder="Enter lesson content in markdown format..."
                  rows={8}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Use markdown formatting for rich text content
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="downloadable"
                  name="downloadable"
                  checked={formData.downloadable}
                  onChange={handleChange}
                  className="rounded"
                />
                <Label htmlFor="downloadable" className="cursor-pointer">
                  Allow students to download this lesson
                </Label>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingLesson ? "Update Lesson" : "Create Lesson"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lessons List */}
      {lessonsLoading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Loading lessons...</p>
          </CardContent>
        </Card>
      ) : lessons.length === 0 ? (
        <Alert>
          <AlertDescription>
            No lessons yet. Click &quot;Add Lesson&quot; to create your first lesson.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson, index) => (
            <Card key={lesson.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                      <span className="font-semibold">{index + 1}</span>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{lesson.title}</h3>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {lesson.video_url && (
                          <Badge variant="secondary">
                            <Video className="mr-1 h-3 w-3" />
                            Video
                          </Badge>
                        )}
                        {lesson.content_md && (
                          <Badge variant="secondary">
                            <FileText className="mr-1 h-3 w-3" />
                            Content
                          </Badge>
                        )}
                        {lesson.downloadable && (
                          <Badge variant="secondary">
                            <Download className="mr-1 h-3 w-3" />
                            Downloadable
                          </Badge>
                        )}
                      </div>

                      {lesson.content_md && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {lesson.content_md.substring(0, 150)}...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(lesson)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(lesson.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
