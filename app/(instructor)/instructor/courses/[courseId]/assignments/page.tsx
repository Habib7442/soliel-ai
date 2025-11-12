import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseAssignmentCreateForm } from "@/components/forms/course-assignment-create-form";

export default async function CourseAssignmentsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const supabase = await createServerClient();
  
  // Unwrap params
  const { courseId } = await params;
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
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
  
  // Fetch assignments for this course
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select(`
      *,
      assignment_submissions(count)
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  
  // Calculate total submissions across all assignments
  const totalSubmissions = assignments?.reduce((total, assignment) => {
    return total + (assignment.assignment_submissions?.[0]?.count || 0);
  }, 0) || 0;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground">Course Assignments</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button asChild variant="outline">
              <Link href={`/instructor/courses/${courseId}`}>Back to Course</Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
                <CardDescription>Manage assignments, submissions, and grading</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <CourseAssignmentCreateForm courseId={courseId} />
                </div>
                
                {assignments && assignments.length > 0 ? (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold">{assignment.title}</h3>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/instructor/courses/${courseId}/assignments/${assignment.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                        <p className="text-muted-foreground text-sm mt-2">
                          {assignment.description?.substring(0, 100)}...
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="text-sm text-muted-foreground">
                            <span>Submissions: {assignment.assignment_submissions?.[0]?.count || 0}</span>
                          </div>
                          <div className="text-sm">
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              {assignment.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No assignments created yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Assignment Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Total Assignments</h3>
                    <p className="text-2xl font-bold">{assignments?.length || 0}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Total Submissions</h3>
                    <p className="text-2xl font-bold">{totalSubmissions}</p>
                  </div>

                  <div>
                    <h3 className="font-medium">Submission Statistics</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pending Review</span>
                        <span>0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Graded</span>
                        <span>0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Overdue</span>
                        <span>0</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Submission Tracking</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Track student submissions and grades in real-time
                    </p>
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