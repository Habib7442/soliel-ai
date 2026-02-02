"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload, FileText, CheckCircle, Clock, AlertCircle, Download, File as FileIcon, Trash2 } from "lucide-react";
import { getAssignmentByLessonId, getStudentAssignmentSubmission, submitAssignment, deleteAssignmentSubmission } from "@/server/actions/instructor.actions";
import { markLessonIncomplete } from "@/server/actions/enrollment.actions";
import { createBrowserClient } from "@supabase/ssr";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface AssignmentRendererProps {
  lessonId: string;
  courseId: string;
  title: string;
  userId: string;
  onComplete?: () => void;
}

export const AssignmentRenderer = ({ lessonId, courseId, title, userId, onComplete }: AssignmentRendererProps) => {
  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch assignment details
        const assignmentResult = await getAssignmentByLessonId(lessonId);
        if (assignmentResult.success && assignmentResult.data) {
          setAssignment(assignmentResult.data);
          
          // Fetch previous submission
          const submissionResult = await getStudentAssignmentSubmission(assignmentResult.data.id, userId);
          if (submissionResult.success && submissionResult.data) {
            setSubmission(submissionResult.data);
          }
        } else {
          toast.error("Failed to load assignment details");
        }
      } catch (error) {
        console.error("Error loading assignment:", error);
        toast.error("Failed to load assignment");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [lessonId, userId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadAndSubmit = async () => {
    if (!selectedFile || !assignment) return;

    // Check file size client-side first (50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 50MB.");
      return;
    }

    setSubmitting(true);
    setUploading(true);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Verify session exists
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to submit assignments. Please refresh or sign in again.");
      }

      const fileExt = selectedFile.name.split('.').pop() || '';
      // Sanitize filename: remove spaces and special characters
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      const fileName = `assignments/${assignment.id}/${userId}_${Date.now()}_${sanitizedName}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log("[DEBUG] Current User:", session.user.id);
      console.log("[DEBUG] Target Path:", filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course-assets')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true // Using upsert: true to be safer
        });

      if (uploadError) {
        console.error("[DEBUG] Full Storage Error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}. Check your internet connection or file name.`);
      }

      console.log("[DEBUG] Upload successful:", uploadData);
      setUploading(false); // Finished storage upload

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course-assets')
        .getPublicUrl(filePath);

      // Submit assignment record to DB
      console.log("[DEBUG] Submitting DB record...");
      const submissionData = {
        assignment_id: assignment.id,
        student_id: userId,
        submission_files: [{
          file_name: selectedFile.name,
          file_url: publicUrl,
          file_size: selectedFile.size
        }]
      };

      const result = await submitAssignment(submissionData);

      if (result.success) {
        toast.success("Assignment submitted successfully!");
        setSubmission(result.data);
        if (onComplete) onComplete();
      } else {
        console.error("[DEBUG] DB Submission Error:", result.error);
        toast.error(result.error || "Upload worked but failed to save the record. Please contact support.");
      }

    } catch (error: any) {
      console.error("Error in handleUploadAndSubmit:", error);
      toast.error(error.message || "An unexpected error occurred. Please check your browser console.");
    } finally {
      setSubmitting(false);
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const handleDeleteSubmission = async () => {
    if (!submission) return;
    
    if (!confirm("Are you sure you want to delete this submission and submit a new one?")) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await deleteAssignmentSubmission(submission.id);
      if (result.success) {
        // Also mark lesson as incomplete in the progress table
        await markLessonIncomplete(userId, lessonId, courseId);
        
        toast.success("Submission deleted. Progress reset.");
        setSubmission(null);
      } else {
        toast.error(result.error || "Failed to delete submission");
      }
    } catch (error) {
      console.error("Error deleting submission:", error);
      toast.error("Failed to delete submission");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading assignment...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        <h3 className="text-lg font-bold">Assignment Not Found</h3>
        <p className="text-muted-foreground">This assignment content could not be loaded.</p>
      </div>
    );
  }

  const isSubmitted = !!submission;
  const isGraded = submission?.grade !== null && submission?.grade !== undefined;

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0 space-y-6">
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">{assignment.title}</h2>
                <div className="flex gap-3">
                  {assignment.due_date && (
                    <Badge variant="outline" className="text-xs bg-white/50">
                      <Clock className="w-3 h-3 mr-1" />
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </Badge>
                  )}
                  {isSubmitted && (
                    <Badge variant={isGraded ? "default" : "secondary"} className="text-xs">
                      {isGraded ? `Graded: ${submission.grade}%` : "Submitted"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {(() => {
              let instructionsText = assignment.instructions || "";
              let attachment = null;
              
              const attachmentRegex = /\n\n\*\*Attachment:\*\* \[(.*?)]\((.*?)\)$/;
              const match = instructionsText.match(attachmentRegex);
              
              if (match) {
                attachment = { name: match[1], url: match[2] };
                instructionsText = instructionsText.replace(attachmentRegex, "");
              } else {
                const fullRegex = /^\*\*Attachment:\*\* \[(.*?)]\((.*?)\)$/;
                const fullMatch = instructionsText.match(fullRegex);
                if (fullMatch) {
                  attachment = { name: fullMatch[1], url: fullMatch[2] };
                  instructionsText = "";
                }
              }

              return (
                <>
                  <div className="prose prose-sm max-w-none text-gray-600 mb-8">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Instructions</h3>
                    <ReactMarkdown>{instructionsText}</ReactMarkdown>
                  </div>

                  {attachment && (
                    <div className="mb-8">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Instructor Resources</h3>
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-100 flex items-center justify-between shadow-sm max-w-md hover:border-blue-300 transition-all group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                            <FileIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="truncate text-left">
                            <p className="font-bold text-sm truncate text-gray-900">{attachment.name}</p>
                            <p className="text-xs text-blue-600 font-medium tracking-tight">Resource File • Click to Download</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-blue-50 shrink-0">
                          <Link href={attachment.url} target="_blank">
                            <Download className="h-5 w-5 text-blue-600" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {isSubmitted ? (
              <div className="bg-green-50/50 border border-green-100 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-bold text-green-800">Assignment Submitted</h3>
                    <p className="text-sm text-green-700">
                      Submitted on {new Date(submission.submitted_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {submission.submission_files?.[0] && (
                    <div className="bg-white rounded-xl p-3 border border-green-100 flex items-center justify-between shadow-sm mb-0 flex-1 w-full max-w-md">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                          <FileIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="truncate">
                          <p className="font-medium text-sm truncate">{submission.submission_files[0].file_name}</p>
                          <p className="text-xs text-muted-foreground">{(submission.submission_files[0].file_size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={submission.submission_files[0].file_url} target="_blank">
                          <Download className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  )}
                  
                  {!isGraded && (
                    <Button 
                      variant="outline" 
                      onClick={handleDeleteSubmission}
                      disabled={submitting}
                      className="text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20 hover:border-destructive rounded-xl font-bold"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                      Delete & Resubmit
                    </Button>
                  )}
                </div>

                {submission.feedback && (
                  <div className="mt-4 pt-4 border-t border-green-200/50">
                    <h4 className="font-bold text-green-800 mb-2">Instructor Feedback</h4>
                    <p className="text-sm text-green-700 bg-white/50 p-3 rounded-xl border border-green-100/50">
                      {submission.feedback}
                    </p>
                  </div>
                )}
                
                {onComplete && !isGraded && (
                  <div className="mt-4">
                     <p className="text-xs text-muted-foreground">You can continue to the next lesson while waiting for grading.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Submit Assignment
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Upload File</Label>
                    <Input 
                      id="file-upload" 
                      type="file" 
                      onChange={handleFileChange} 
                      disabled={submitting}
                      className="cursor-pointer file:cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload your assignment file. Max size: 50MB.
                    </p>
                  </div>

                  <Button 
                    onClick={handleUploadAndSubmit} 
                    disabled={!selectedFile || submitting}
                    className="w-full sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {uploading ? "Uploading..." : "Submitting..."}
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Submit Assignment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
