"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  createAssignment,
  getCourseAssignments,
  getAssignmentSubmissions,
  gradeAssignment,
  deleteAssignment
} from "@/server/actions/instructor.actions";
import { useInstructorStore } from "@/hooks/useInstructorStore";
import { PlusCircle, Edit, Trash2, FileText, CheckCircle, Clock } from "lucide-react";

interface AssignmentManagerProps {
  courseId: string;
}

export const AssignmentManager = ({ courseId }: AssignmentManagerProps) => {
  const { 
    assignments, 
    setAssignments, 
    assignmentSubmissions,
    setAssignmentSubmissions,
    assignmentsLoading,
    setAssignmentsLoading 
  } = useInstructorStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGradingDialogOpen, setIsGradingDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "file_upload" as const,
    due_at: "",
  });
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

    fetchAssignments();
  }, [courseId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Title and instructions are required");
      return;
    }

    try {
      const result = await createAssignment({
        lesson_id: courseId, // Using courseId as lesson_id for now
        title: formData.title,
        instructions: formData.description,
        type: formData.type,
        due_date: formData.due_at || undefined,
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

  const viewSubmissions = async (assignmentId: string) => {
    const result = await getAssignmentSubmissions(assignmentId);
    if (result.success && result.data) {
      setAssignmentSubmissions(result.data);
    }
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

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "file_upload",
      due_at: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assignments</h2>
          <p className="text-muted-foreground">Create assignments and grade student submissions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>
                Add a new assignment for students to complete
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
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

              <div>
                <Label htmlFor="description">Instructions *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide detailed instructions for students..."
                  rows={6}
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Submission Type</Label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="file_upload">File Upload</option>
                  <option value="link_submission">Link Submission</option>
                  <option value="text_entry">Text Entry</option>
                </select>
              </div>

              <div>
                <Label htmlFor="due_at">Due Date (Optional)</Label>
                <Input
                  id="due_at"
                  name="due_at"
                  type="datetime-local"
                  value={formData.due_at}
                  onChange={handleChange}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Assignment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {assignmentsLoading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Loading assignments...</p>
          </CardContent>
        </Card>
      ) : assignments.length === 0 ? (
        <Alert>
          <AlertDescription>
            No assignments yet. Click &quot;Create Assignment&quot; to add your first assignment.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {assignment.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {assignment.description?.substring(0, 150)}...
                    </CardDescription>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="secondary">
                        {assignment.type?.replace('_', ' ')}
                      </Badge>
                      {assignment.due_at && (
                        <Badge variant="outline">
                          <Clock className="mr-1 h-3 w-3" />
                          Due: {new Date(assignment.due_at).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
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
                  onClick={() => viewSubmissions(assignment.id)}
                >
                  View Submissions
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Grading Dialog */}
      <Dialog open={isGradingDialogOpen} onOpenChange={setIsGradingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              Provide a grade and feedback for this submission
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGradeSubmit} className="space-y-4">
            <div>
              <Label htmlFor="grade">Grade (0-100) *</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max="100"
                value={gradingData.grade}
                onChange={(e) => setGradingData({ ...gradingData, grade: e.target.value })}
                placeholder="Enter grade"
                required
              />
            </div>

            <div>
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={gradingData.feedback}
                onChange={(e) => setGradingData({ ...gradingData, feedback: e.target.value })}
                placeholder="Provide feedback to the student..."
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsGradingDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Submit Grade
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
