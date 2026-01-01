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
  createSection,
  getCourseSections,
  updateSection,
  deleteSection
} from "@/server/actions/instructor.actions";
import { PlusCircle, Edit, Trash2, GripVertical, Video, FileText, Download, ChevronDown, ChevronRight, FileQuestion, Clipboard, Code } from "lucide-react";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface CurriculumManagerProps {
  courseId: string;
}

interface Lesson {
  id: string;
  title: string;
  content_md?: string;
  video_url?: string;
  downloadable: boolean;
  order_index: number;
  lesson_type?: "video" | "text" | "pdf" | "quiz" | "assignment" | "lab";
  is_preview?: boolean;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
}

export const CurriculumManager = ({ courseId }: CurriculumManagerProps) => {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  // Section Dialog State
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionFormData, setSectionFormData] = useState({
    title: "",
    description: "",
  });

  // Lesson Dialog State
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [lessonFormData, setLessonFormData] = useState({
    title: "",
    content_md: "",
    video_url: "",
    downloadable: false,
    lesson_type: "video" as "video" | "text" | "pdf" | "quiz" | "assignment" | "lab",
    is_preview: false,
  });

  // Fetch sections with lessons on mount
  useEffect(() => {
    fetchSections();
  }, [courseId]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const result = await getCourseSections(courseId);
      if (result.success && result.data) {
        setSections(result.data);
        // Auto-expand all sections
        setExpandedSections(new Set(result.data.map((s: Section) => s.id)));
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      toast.error("Failed to load curriculum");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Section Handlers
  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sectionFormData.title.trim()) {
      toast.error("Section title is required");
      return;
    }

    try {
      if (editingSection) {
        const result = await updateSection(editingSection.id, {
          title: sectionFormData.title,
          description: sectionFormData.description || undefined,
        });
        if (result.success) {
          toast.success("Section updated successfully!");
          fetchSections();
        } else {
          toast.error(result.error || "Failed to update section");
        }
      } else {
        const result = await createSection({
          course_id: courseId,
          title: sectionFormData.title,
          description: sectionFormData.description || undefined,
          order_index: sections.length,
        });

        if (result.success) {
          toast.success("Section created successfully!");
          fetchSections();
        } else {
          toast.error(result.error || "Failed to create section");
        }
      }

      resetSectionForm();
      setIsSectionDialogOpen(false);
    } catch (error) {
      console.error("Error submitting section:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleSectionEdit = (section: Section) => {
    setEditingSection(section);
    setSectionFormData({
      title: section.title,
      description: section.description || "",
    });
    setIsSectionDialogOpen(true);
  };

  const handleSectionDelete = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section? All lessons in this section will also be deleted.")) {
      return;
    }

    const result = await deleteSection(sectionId);
    if (result.success) {
      toast.success("Section deleted successfully!");
      fetchSections();
    } else {
      toast.error(result.error || "Failed to delete section");
    }
  };

  const resetSectionForm = () => {
    setEditingSection(null);
    setSectionFormData({
      title: "",
      description: "",
    });
  };

  // Lesson Handlers
  const openLessonDialog = (sectionId: string, lesson?: Lesson) => {
    setCurrentSectionId(sectionId);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonFormData({
        title: lesson.title,
        content_md: lesson.content_md || "",
        video_url: lesson.video_url || "",
        downloadable: lesson.downloadable || false,
        lesson_type: (lesson.lesson_type as "video" | "text" | "pdf" | "quiz" | "assignment" | "lab") || "video",
        is_preview: lesson.is_preview || false,
      });
    }
    setIsLessonDialogOpen(true);
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lessonFormData.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }

    if (!currentSectionId) {
      toast.error("Section ID is missing");
      return;
    }

    try {
      if (editingLesson) {
        const result = await updateLesson(editingLesson.id, lessonFormData);
        if (result.success) {
          toast.success("Lesson updated successfully!");
          fetchSections();
        } else {
          toast.error(result.error || "Failed to update lesson");
        }
      } else {
        const section = sections.find(s => s.id === currentSectionId);
        const result = await addLesson({
          course_id: courseId,
          section_id: currentSectionId,
          title: lessonFormData.title,
          content_md: lessonFormData.content_md,
          video_url: lessonFormData.video_url,
          downloadable: lessonFormData.downloadable,
          lesson_type: lessonFormData.lesson_type,
          is_preview: lessonFormData.is_preview,
          order_index: section?.lessons.length || 0,
        });

        if (result.success) {
          toast.success("Lesson created successfully!");
          fetchSections();
        } else {
          toast.error(result.error || "Failed to create lesson");
        }
      }

      resetLessonForm();
      setIsLessonDialogOpen(false);
    } catch (error) {
      console.error("Error submitting lesson:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleLessonDelete = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) {
      return;
    }

    const result = await deleteLesson(lessonId);
    if (result.success) {
      toast.success("Lesson deleted successfully!");
      fetchSections();
    } else {
      toast.error(result.error || "Failed to delete lesson");
    }
  };

  const resetLessonForm = () => {
    setEditingLesson(null);
    setCurrentSectionId(null);
    setLessonFormData({
      title: "",
      content_md: "",
      video_url: "",
      downloadable: false,
      lesson_type: "video" as "video" | "text" | "pdf" | "quiz" | "assignment" | "lab",
      is_preview: false,
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
        <Dialog open={isSectionDialogOpen} onOpenChange={(open) => {
          setIsSectionDialogOpen(open);
          if (!open) resetSectionForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingSection ? "Edit Section" : "Add New Section"}</DialogTitle>
              <DialogDescription>
                {editingSection ? "Update section details" : "Create a new section for your course"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSectionSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="section-title">Section Title *</Label>
                <Input
                  id="section-title"
                  value={sectionFormData.title}
                  onChange={(e) => setSectionFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Introduction to React"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="section-description">Description</Label>
                <Textarea
                  id="section-description"
                  value={sectionFormData.description}
                  onChange={(e) => setSectionFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of what this section covers"
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsSectionDialogOpen(false);
                    resetSectionForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSection ? "Update Section" : "Create Section"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={(open) => {
        setIsLessonDialogOpen(open);
        if (!open) resetLessonForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Edit Lesson" : "Add New Lesson"}</DialogTitle>
            <DialogDescription>
              {editingLesson ? "Update lesson details" : "Create a new lesson for this section"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLessonSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Lesson Title *</Label>
              <Input
                id="lesson-title"
                value={lessonFormData.title}
                onChange={(e) => setLessonFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter lesson title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-type">Lesson Type *</Label>
              <select
                id="lesson-type"
                value={lessonFormData.lesson_type}
                onChange={(e) => setLessonFormData(prev => ({ 
                  ...prev, 
                  lesson_type: e.target.value as "video" | "text" | "pdf" | "quiz" | "assignment" | "lab"
                }))}
                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="video">Video Lesson</option>
                <option value="text">Text/Article</option>
                <option value="pdf">PDF Document</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
                <option value="lab">Coding Lab</option>
              </select>
            </div>

            {(lessonFormData.lesson_type === "video") && (
              <div className="space-y-2">
                <Label htmlFor="video_url">Video URL</Label>
                <Input
                  id="video_url"
                  value={lessonFormData.video_url}
                  onChange={(e) => setLessonFormData(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  type="url"
                />
                <p className="text-sm text-muted-foreground">
                  Paste a YouTube, Vimeo, or other video URL
                </p>
              </div>
            )}

            {(lessonFormData.lesson_type === "pdf") && (
              <div className="space-y-2">
                <Label htmlFor="pdf_url">PDF URL</Label>
                <Input
                  id="pdf_url"
                  value={lessonFormData.video_url}
                  onChange={(e) => setLessonFormData(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="https://... or upload PDF"
                  type="url"
                />
                <p className="text-sm text-muted-foreground">
                  Upload or link to a PDF document
                </p>
              </div>
            )}

            {(lessonFormData.lesson_type === "text" || lessonFormData.lesson_type === "assignment" || lessonFormData.lesson_type === "lab") && (
              <div className="space-y-2">
                <Label htmlFor="content_md">
                  {lessonFormData.lesson_type === "assignment" ? "Assignment Instructions" : 
                   lessonFormData.lesson_type === "lab" ? "Lab Instructions" : 
                   "Lesson Content"}
                </Label>
                <MDEditor
                  value={lessonFormData.content_md}
                  onChange={(value) => setLessonFormData(prev => ({ ...prev, content_md: value || "" }))}
                  preview="edit"
                  height={300}
                />
                <p className="text-sm text-muted-foreground">
                  {lessonFormData.lesson_type === "assignment" ? "Describe what students need to do" :
                   lessonFormData.lesson_type === "lab" ? "Provide lab setup and instructions" :
                   "Use markdown formatting for rich text content"}
                </p>
              </div>
            )}

            {lessonFormData.lesson_type === "quiz" && (
              <Alert>
                <FileQuestion className="h-4 w-4" />
                <AlertDescription>
                  Quiz questions can be added after creating the lesson. Use the Quiz Manager in the course details page.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_preview"
                checked={lessonFormData.is_preview}
                onChange={(e) => setLessonFormData(prev => ({ ...prev, is_preview: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="is_preview" className="cursor-pointer">
                Free preview lesson
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="downloadable"
                checked={lessonFormData.downloadable}
                onChange={(e) => setLessonFormData(prev => ({ ...prev, downloadable: e.target.checked }))}
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
                  setIsLessonDialogOpen(false);
                  resetLessonForm();
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

      {/* Sections List */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Loading curriculum...</p>
          </CardContent>
        </Card>
      ) : sections.length === 0 ? (
        <Alert>
          <AlertDescription>
            No sections yet. Click &quot;Add Section&quot; to create your first section.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {sections.map((section, sectionIndex) => {
            const isExpanded = expandedSections.has(section.id);
            
            return (
              <Card key={section.id} className="overflow-hidden">
                <div className="p-4 bg-muted/50 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="mt-1 hover:bg-background rounded p-1"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">
                          {String(sectionIndex + 1).padStart(2, '0')} — {section.title}
                        </h3>
                        {section.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {section.description}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                          Lessons ({section.lessons?.length || 0})
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openLessonDialog(section.id)}
                      >
                        Manage Section
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSectionEdit(section)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleSectionDelete(section.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <CardContent className="p-4">
                    {section.lessons && section.lessons.length > 0 ? (
                      <div className="space-y-3">
                        {section.lessons.map((lesson, lessonIndex) => {
                          const getLessonIcon = () => {
                            switch (lesson.lesson_type) {
                              case "video": return <Video className="mr-1 h-3 w-3" />;
                              case "text": return <FileText className="mr-1 h-3 w-3" />;
                              case "pdf": return <FileText className="mr-1 h-3 w-3" />;
                              case "quiz": return <FileQuestion className="mr-1 h-3 w-3" />;
                              case "assignment": return <Clipboard className="mr-1 h-3 w-3" />;
                              case "lab": return <Code className="mr-1 h-3 w-3" />;
                              default: return <FileText className="mr-1 h-3 w-3" />;
                            }
                          };

                          const getLessonTypeLabel = () => {
                            switch (lesson.lesson_type) {
                              case "video": return "Video";
                              case "text": return "Text";
                              case "pdf": return "Pdf";
                              case "quiz": return "Quiz";
                              case "assignment": return "Assignment";
                              case "lab": return "Lab";
                              default: return "Lesson";
                            }
                          };

                          return (
                            <div key={lesson.id} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                              <div className="text-muted-foreground font-semibold min-w-[30px]">
                                {lessonIndex + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium mb-1">{lesson.title}</h4>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">
                                    {getLessonIcon()}
                                    {getLessonTypeLabel()}
                                  </Badge>
                                  {lesson.is_preview && (
                                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                                      Preview
                                    </Badge>
                                  )}
                                  {lesson.downloadable && (
                                    <Badge variant="secondary">
                                      <Download className="mr-1 h-3 w-3" />
                                      Downloadable
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openLessonDialog(section.id, lesson)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleLessonDelete(lesson.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground text-sm mb-3">
                          No lessons in this section yet.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openLessonDialog(section.id)}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add First Lesson
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
