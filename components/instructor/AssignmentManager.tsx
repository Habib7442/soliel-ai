"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  createAssignment,
  getCourseAssignments,
  getAssignmentSubmissions,
  gradeAssignment,
  deleteAssignment,
  updateAssignment,
  addLesson,
  updateLesson
} from "@/server/actions/instructor.actions";
import {
  useInstructorStore,
  AssignmentSubmission,
} from "@/hooks/useInstructorStore";
import {
  PlusCircle,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Loader2,
  X,
  Upload
} from "lucide-react";

interface AssignmentManagerProps {
  courseId: string;
}

// Define types that match what's actually returned from the server
interface Assignment {
  id: string;
  lesson_id: string;
  title: string;
  instructions: string;
  due_date?: string;
  created_at: string;
  course_id?: string;
  lesson_title?: string;
  section_id?: string;
}

interface SubmissionFromServer {
  id: string;
  submission_files:
    | {
        file_name: string;
        file_url: string;
        file_size: number;
      }[]
    | null;
  grade: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
  profiles:
    | {
        id: string;
        full_name: string;
        email: string;
      }[]
    | null;
}

interface MappedSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  content_url?: string;
  text_entry?: string;
  submitted_at: string;
  grade_percent?: number;
  graded_by?: string;
  graded_at?: string;
  student_name: string;
  student_email: string;
}

export const AssignmentManager = ({ courseId }: AssignmentManagerProps) => {
  const {
    assignments,
    setAssignments,
    assignmentSubmissions,
    setAssignmentSubmissions,
    assignmentsLoading,
    setAssignmentsLoading,
  } = useInstructorStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmissionsDialogOpen, setIsSubmissionsDialogOpen] = useState(false);
  const [isGradingDialogOpen, setIsGradingDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionFromServer | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    instructions: "",
    due_date: "",
    section_id: "",
  });
  const [instructorFile, setInstructorFile] = useState<File | null>(null);
  const [uploadingInstructorFile, setUploadingInstructorFile] = useState(false);
  const [existingAttachment, setExistingAttachment] = useState<{name: string, url: string} | null>(null);
  
  const [gradingData, setGradingData] = useState({
    grade: "",
    feedback: "",
  });

  useEffect(() => {
    const fetchAssignments = async () => {
      setAssignmentsLoading(true);
      const result = await getCourseAssignments(courseId);
      if (result.success && result.data) {
        setAssignments(result.data);
      }
      setAssignmentsLoading(false);
    };

    const fetchSections = async () => {
      try {
        const { createBrowserClient } = await import('@supabase/ssr');
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const { data, error } = await supabase
          .from('course_sections')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });
          
        if (error) throw error;
        setSections(data || []);
      } catch (error) {
        console.error("Error fetching sections:", error);
        toast.error("Failed to load course sections");
      } finally {
        setLoadingSections(false);
      }
    };

    fetchAssignments();
    fetchSections();
  }, [courseId, setAssignments, setAssignmentsLoading]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.instructions.trim() && !instructorFile) {
      toast.error("Please provide instructions or attach a file");
      return;
    }

    if (!formData.section_id) {
      toast.error("Please select a section for this assignment");
      return;
    }

    setUploadingInstructorFile(true);

    try {
      let finalInstructions = formData.instructions;

      // Handle File Upload
      if (instructorFile) {
         try {
           const { createBrowserClient } = await import('@supabase/ssr');
           const supabase = createBrowserClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
           );
           
           const fileExt = instructorFile.name.split('.').pop();
           const fileName = `assignments/${courseId}/${Date.now()}_${instructorFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
           
           const { error: uploadError } = await supabase.storage
              .from('course-assets')
              .upload(fileName, instructorFile);
              
           if (uploadError) throw new Error("Upload failed: " + uploadError.message);
           
           const { data: { publicUrl } } = supabase.storage
              .from('course-assets')
              .getPublicUrl(fileName);
              
           finalInstructions = `${formData.instructions ? formData.instructions + "\n\n" : ""}**Attachment:** [${instructorFile.name}](${publicUrl})`;
         } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to upload file");
            setUploadingInstructorFile(false);
            return;
         }
      }

      // Calculate order index
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: existingLessons } = await supabase
        .from('lessons')
        .select('order_index')
        .eq('section_id', formData.section_id)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingLessons && existingLessons.length > 0 
        ? existingLessons[0].order_index + 1 
        : 0;

      // First, create an assignment lesson
      const lessonResult = await addLesson({
        course_id: courseId,
        section_id: formData.section_id,
        title: formData.title,
        lesson_type: 'assignment',
        order_index: nextOrderIndex,
      });

      if (!lessonResult.success || !lessonResult.data) {
        toast.error(lessonResult.error || "Failed to create assignment lesson");
        setUploadingInstructorFile(false);
        return;
      }

      // Then, create the assignment using the lesson ID
      const result = await createAssignment({
        lesson_id: lessonResult.data.id,
        title: formData.title,
        instructions: finalInstructions,
        due_date: formData.due_date || undefined,
      });

      if (result.success) {
        toast.success("Assignment created successfully!");
        const updatedAssignments = await getCourseAssignments(courseId);
        if (updatedAssignments.success && updatedAssignments.data) {
          setAssignments(updatedAssignments.data);
        }
        resetForm();
        setIsDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to create assignment");
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setUploadingInstructorFile(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.instructions.trim() && !instructorFile && !existingAttachment) {
      toast.error("Please provide instructions or attach a file");
      return;
    }

    if (!selectedAssignment) return;

    setUploadingInstructorFile(true);

    try {
      let finalInstructions = formData.instructions;
      let currentFileUrl = existingAttachment?.url;
      let currentFileName = existingAttachment?.name;

      // Handle New File Upload
      if (instructorFile) {
         try {
           const { createBrowserClient } = await import('@supabase/ssr');
           const supabase = createBrowserClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
           );
           
           const fileExt = instructorFile.name.split('.').pop();
           const fileName = `assignments/${courseId}/${Date.now()}_${instructorFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
           
           const { error: uploadError } = await supabase.storage
              .from('course-assets')
              .upload(fileName, instructorFile);
              
           if (uploadError) throw new Error("Upload failed: " + uploadError.message);
           
           const { data: { publicUrl } } = supabase.storage
              .from('course-assets')
              .getPublicUrl(fileName);
              
           currentFileUrl = publicUrl;
           currentFileName = instructorFile.name;
         } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to upload file");
            setUploadingInstructorFile(false);
            return;
         }
      }

      if (currentFileUrl) {
         finalInstructions = `${formData.instructions ? formData.instructions + "\n\n" : ""}**Attachment:** [${currentFileName}](${currentFileUrl})`;
      }

      // Check if section changed
      if (formData.section_id && formData.section_id !== selectedAssignment.section_id) {
          const { createBrowserClient } = await import('@supabase/ssr');
          const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          
          const { data: existingLessons } = await supabase
            .from('lessons')
            .select('order_index')
            .eq('section_id', formData.section_id)
            .order('order_index', { ascending: false })
            .limit(1);

          const nextOrderIndex = existingLessons && existingLessons.length > 0 
            ? existingLessons[0].order_index + 1 
            : 0;
            
          await updateLesson(selectedAssignment.lesson_id, {
             section_id: formData.section_id,
             order_index: nextOrderIndex
          });
      }

      const result = await updateAssignment(selectedAssignment.id, {
        title: formData.title,
        instructions: finalInstructions,
        due_date: formData.due_date || undefined,
      });

      if (result.success) {
        toast.success("Assignment updated successfully!");
        const updatedAssignments = await getCourseAssignments(courseId);
        if (updatedAssignments.success && updatedAssignments.data) {
          setAssignments(updatedAssignments.data);
        }
        resetForm();
        setIsDialogOpen(false);
        setSelectedAssignment(null);
      } else {
        toast.error(result.error || "Failed to update assignment");
      }
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setUploadingInstructorFile(false);
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSubmission) return;

    const grade = parseFloat(gradingData.grade);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast.error("Please enter a valid grade (0-100)");
      return;
    }

    try {
      const result = await gradeAssignment(selectedSubmission.id, {
        grade,
        feedback: gradingData.feedback,
      });

      if (result.success) {
        toast.success("Assignment graded successfully!");
        // Refresh submissions
        if (selectedAssignment) {
          const result = await getAssignmentSubmissions(selectedAssignment.id);
          if (result.success && result.data) {
            // Map server data to store-compatible format
            const mappedSubmissions: MappedSubmission[] = result.data.map(
              (sub: SubmissionFromServer) => ({
                id: sub.id,
                assignment_id: selectedAssignment.id,
                user_id: sub.profiles?.[0]?.id || "",
                content_url: sub.submission_files?.[0]?.file_url || undefined,
                text_entry: undefined,
                submitted_at: sub.submitted_at,
                grade_percent:
                  sub.grade !== null ? Number(sub.grade) : undefined,
                graded_by: undefined,
                graded_at: sub.graded_at || undefined,
                student_name: sub.profiles?.[0]?.full_name || "Unknown Student",
                student_email: sub.profiles?.[0]?.email || "No email",
              })
            );
            setAssignmentSubmissions(
              mappedSubmissions as unknown as AssignmentSubmission[]
            );
          }
        }
        setIsGradingDialogOpen(false);
        setGradingData({ grade: "", feedback: "" });
        setSelectedSubmission(null);
      } else {
        toast.error(result.error || "Failed to grade assignment");
      }
    } catch (error) {
      console.error("Error grading assignment:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const viewSubmissions = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    const result = await getAssignmentSubmissions(assignment.id);
    if (result.success && result.data) {
      // Map server data to store-compatible format
      const mappedSubmissions: MappedSubmission[] = result.data.map(
        (sub: SubmissionFromServer) => ({
          id: sub.id,
          assignment_id: assignment.id,
          user_id: sub.profiles?.[0]?.id || "",
          content_url: sub.submission_files?.[0]?.file_url || undefined,
          text_entry: undefined,
          submitted_at: sub.submitted_at,
          grade_percent: sub.grade !== null ? Number(sub.grade) : undefined,
          graded_by: undefined,
          graded_at: sub.graded_at || undefined,
          student_name: sub.profiles?.[0]?.full_name || "Unknown Student",
          student_email: sub.profiles?.[0]?.email || "No email",
        })
      );
      setAssignmentSubmissions(
        mappedSubmissions as unknown as AssignmentSubmission[]
      );
    }
    setIsSubmissionsDialogOpen(true);
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) {
      return;
    }

    const result = await deleteAssignment(assignmentId);
    if (result.success) {
      toast.success("Assignment deleted successfully!");
      const updatedAssignments = await getCourseAssignments(courseId);
      if (updatedAssignments.success && updatedAssignments.data) {
        setAssignments(updatedAssignments.data);
      }
    } else {
      toast.error(result.error || "Failed to delete assignment");
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    
    // Parse instructions for attachment
    let instructions = assignment.instructions || "";
    let attachment = null;
    
    const attachmentRegex = /\n\n\*\*Attachment:\*\* \[(.*?)]\((.*?)\)$/;
    const match = instructions.match(attachmentRegex);
    
    if (match) {
      attachment = { name: match[1], url: match[2] };
      instructions = instructions.replace(attachmentRegex, "");
    } else {
      // Check if it's the only thing in the instructions
      const fullRegex = /^\*\*Attachment:\*\* \[(.*?)]\((.*?)\)$/;
      const fullMatch = instructions.match(fullRegex);
      if (fullMatch) {
        attachment = { name: fullMatch[1], url: fullMatch[2] };
        instructions = "";
      }
    }

    setExistingAttachment(attachment);
    setFormData({
      title: assignment.title,
      instructions: instructions,
      due_date: assignment.due_date ? assignment.due_date.substring(0, 16) : "",
      section_id: assignment.section_id || "", 
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      instructions: "",
      due_date: "",
      section_id: "",
    });
    setInstructorFile(null);
    setExistingAttachment(null);
  };

  const openGradingDialog = (submission: SubmissionFromServer) => {
    setSelectedSubmission(submission);
    setGradingData({
      grade: submission.grade?.toString() || "",
      feedback: submission.feedback || "",
    });
    setIsGradingDialogOpen(true);
  };

  const downloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assignments</h2>
          <p className="text-muted-foreground">
            Create assignments and grade student submissions
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              resetForm();
              setSelectedAssignment(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedAssignment
                  ? "Edit Assignment"
                  : "Create New Assignment"}
              </DialogTitle>
              <DialogDescription>
                {selectedAssignment
                  ? "Edit the assignment details"
                  : "Add a new assignment for students to complete"}
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={selectedAssignment ? handleUpdate : handleSubmit}
              className="space-y-4 pb-6"
            >
              <div className="space-y-2">
                <Label htmlFor="title">Assignment Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter assignment title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="section_id">Section / Module *</Label>
                <select
                  id="section_id"
                  name="section_id"
                  value={formData.section_id}
                  onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={loadingSections}
                >
                  <option value="">Select section where assignment will appear</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  placeholder="Provide detailed instructions for students..."
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                 <Label htmlFor="instructor-file">Attach File (Optional)</Label>
                 
                 {existingAttachment && !instructorFile && (
                   <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2 overflow-hidden">
                       <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                       <span className="text-sm font-medium truncate">{existingAttachment.name}</span>
                     </div>
                     <Button 
                       type="button" 
                       variant="ghost" 
                       size="icon" 
                       className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                       onClick={() => setExistingAttachment(null)}
                     >
                       <X className="h-4 w-4" />
                     </Button>
                   </div>
                 )}

                 <div className="flex items-center gap-2">
                    <Input
                       id="instructor-file"
                       type="file"
                       onChange={(e) => setInstructorFile(e.target.files?.[0] || null)}
                       className="flex-1 cursor-pointer file:cursor-pointer"
                       disabled={uploadingInstructorFile}
                    />
                    {instructorFile && (
                       <Button 
                         type="button" 
                         variant="ghost" 
                         size="icon"
                         onClick={() => {
                            setInstructorFile(null);
                            const input = document.getElementById('instructor-file') as HTMLInputElement;
                            if(input) input.value = '';
                         }}
                       >
                          <X className="h-4 w-4" />
                       </Button>
                    )}
                 </div>
                 <p className="text-xs text-muted-foreground">Upload a PDF, document, or resource for students.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date (Optional)</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={handleChange}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploadingInstructorFile}>
                  {uploadingInstructorFile ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                    </>
                  ) : selectedAssignment
                    ? "Update Assignment"
                    : "Create Assignment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {assignmentsLoading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Loading assignments...
            </p>
          </CardContent>
        </Card>
      ) : assignments.length === 0 ? (
        <Alert>
          <AlertDescription>
            No assignments yet. Click &quot;Create Assignment&quot; to add your
            first assignment.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment: Assignment) => (
            <Card
              key={assignment.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {assignment.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {assignment.instructions?.substring(0, 150)}...
                    </CardDescription>
                    <div className="flex gap-2 mt-3">
                      {assignment.due_date && (
                        <Badge variant="outline">
                          <Clock className="mr-1 h-3 w-3" />
                          Due:{" "}
                          {new Date(assignment.due_date).toLocaleDateString()}
                        </Badge>
                      )}
                      {assignment.lesson_title && (
                        <Badge variant="secondary">
                          Lesson: {assignment.lesson_title}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(assignment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(assignment.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewSubmissions(assignment)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Submissions
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Submissions Dialog */}
      <Dialog
        open={isSubmissionsDialogOpen}
        onOpenChange={setIsSubmissionsDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assignment Submissions</DialogTitle>
            <DialogDescription>
              {selectedAssignment?.title} - View and grade student submissions
            </DialogDescription>
          </DialogHeader>

          {assignmentSubmissions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No submissions yet for this assignment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(assignmentSubmissions as unknown as MappedSubmission[]).map(
                (submission) => (
                  <Card key={submission.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {submission.student_name || "Unknown Student"}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {submission.student_email || "No email"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {submission.grade_percent !== undefined ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Graded: {submission.grade_percent}%
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            Submitted:{" "}
                            {new Date(
                              submission.submitted_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* We don't have direct access to submission_files here, but we can show content_url if available */}
                        {submission.content_url && (
                          <div>
                            <h4 className="font-medium mb-2">
                              Submitted File:
                            </h4>
                            <div className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="text-sm">Assignment File</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  downloadFile(
                                    submission.content_url!,
                                    "assignment-file"
                                  )
                                }
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {submission.text_entry && (
                          <div>
                            <h4 className="font-medium mb-2">
                              Text Submission:
                            </h4>
                            <p className="text-sm bg-muted p-2 rounded">
                              {submission.text_entry}
                            </p>
                          </div>
                        )}

                        {submission.student_email && (
                          <div>
                            <h4 className="font-medium mb-2">Feedback:</h4>
                            <p className="text-sm bg-muted p-2 rounded">
                              {submission.student_email}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <Button
                            onClick={() => {
                              // Find the original submission data to pass to the grading dialog
                              const originalSubmission = (
                                assignmentSubmissions as unknown as MappedSubmission[]
                              ).find((sub) => sub.id === submission.id);
                              if (originalSubmission) {
                                // We need to reconstruct the original server data
                                const serverSubmission: SubmissionFromServer = {
                                  id: originalSubmission.id,
                                  submission_files:
                                    originalSubmission.content_url
                                      ? [
                                          {
                                            file_name: "assignment-file",
                                            file_url:
                                              originalSubmission.content_url,
                                            file_size: 0,
                                          },
                                        ]
                                      : null,
                                  grade:
                                    originalSubmission.grade_percent !==
                                    undefined
                                      ? originalSubmission.grade_percent
                                      : null,
                                  feedback:
                                    originalSubmission.student_email || null,
                                  submitted_at: originalSubmission.submitted_at,
                                  graded_at:
                                    originalSubmission.graded_at || null,
                                  profiles: originalSubmission.student_name
                                    ? [
                                        {
                                          id: originalSubmission.user_id,
                                          full_name:
                                            originalSubmission.student_name,
                                          email:
                                            originalSubmission.student_email ||
                                            "No email",
                                        },
                                      ]
                                    : null,
                                };
                                openGradingDialog(serverSubmission);
                              }
                            }}
                          >
                            {submission.grade_percent !== undefined
                              ? "Re-grade"
                              : "Grade"}{" "}
                            Submission
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Grading Dialog */}
      <Dialog
        open={isGradingDialogOpen}
        onOpenChange={(open) => {
          setIsGradingDialogOpen(open);
          if (!open) {
            setSelectedSubmission(null);
            setGradingData({ grade: "", feedback: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              Provide a grade and feedback for this submission
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGradeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade (0-100) *</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max="100"
                value={gradingData.grade}
                onChange={(e) =>
                  setGradingData({ ...gradingData, grade: e.target.value })
                }
                placeholder="Enter grade"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={gradingData.feedback}
                onChange={(e) =>
                  setGradingData({ ...gradingData, feedback: e.target.value })
                }
                placeholder="Provide feedback to the student..."
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGradingDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Submit Grade</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
