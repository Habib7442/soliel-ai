import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AssignmentDetailPage({ 
  params 
}: { 
  params: Promise<{ courseId: string; assignmentId: string }> 
}) {
  const supabase = await createServerClient();
  
  // Unwrap params
  const { courseId, assignmentId } = await params;
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Fetch assignment details
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .single();
  
  if (assignmentError || !assignment) {
    return <div>Assignment not found</div>;
  }
  
  // Fetch course details
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();
  
  if (courseError || !course) {
    return <div>Course not found</div>;
  }
  
  // Verify instructor owns this course
  if (course.instructor_id !== user.id) {
    redirect("/instructor-dashboard");
  }
  
  // Fetch submissions for this assignment
  const { data: submissions, error: submissionsError } = await supabase
    .from('assignment_submissions')
    .select(`
      *,
      profiles (full_name, email)
    `)
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false });
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{assignment.title}</h1>
            <p className="text-muted-foreground">Assignment in {course.title}</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button asChild variant="outline">
              <Link href={`/instructor/courses/${courseId}/assignments`}>Back to Assignments</Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
                <CardDescription>Instructions and requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {assignment.instructions ? (
                    <div dangerouslySetInnerHTML={{ __html: assignment.instructions }} />
                  ) : (
                    <p className="text-muted-foreground">No instructions provided.</p>
                  )}
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Submission Requirements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">File Types Allowed</h4>
                      <p>{assignment.file_types_allowed || 'Any file type'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Maximum File Size</h4>
                      <p>{assignment.max_file_size_mb || 10} MB</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Multiple Files</h4>
                      <p>{assignment.allow_multiple_files ? 'Allowed' : 'Not allowed'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Due Date</h4>
                      <p>{assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submission Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Total Submissions</h3>
                    <p className="text-2xl font-bold">{submissions?.length || 0}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Grading Progress</h3>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: submissions && submissions.length > 0 
                              ? `${(submissions.filter(s => s.grade_percent !== null).length / submissions.length) * 100}%` 
                              : '0%' 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>
                          {submissions ? submissions.filter(s => s.grade_percent !== null).length : 0} graded
                        </span>
                        <span>
                          {submissions ? submissions.filter(s => s.grade_percent === null).length : 0} pending
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Recent Submissions</h3>
                    {submissions && submissions.length > 0 ? (
                      <div className="mt-2 space-y-3">
                        {submissions.slice(0, 3).map((submission) => (
                          <div key={submission.id} className="flex items-center justify-between text-sm">
                            <div>
                              <p className="font-medium">{submission.profiles?.full_name || 'Unknown Student'}</p>
                              <p className="text-muted-foreground">
                                {new Date(submission.submitted_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              {submission.grade_percent !== null ? (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                  {submission.grade_percent}%
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm mt-2">No submissions yet.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}