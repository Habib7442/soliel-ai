import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CourseLabsPage({ params }: { params: Promise<{ courseId: string }> }) {
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
  
  // For now, we'll create a placeholder for labs
  // In a real implementation, you would fetch actual lab data from the database
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground">Interactive Labs</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button asChild variant="outline">
              <Link href={`/instructor/courses/${courseId}`}>Back to Course</Link>
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Interactive Coding Labs</CardTitle>
            <CardDescription>Manage your interactive coding environments and practice tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Lab Environment Setup</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Configure the coding environment for your students
                  </p>
                  <Button variant="outline" className="w-full">
                    Configure Environment
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Lab Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Create detailed step-by-step lab instructions
                  </p>
                  <Button variant="outline" className="w-full">
                    Edit Instructions
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Lab Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Review and grade student lab submissions
                  </p>
                  <Button variant="outline" className="w-full">
                    View Submissions
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Create New Lab</h3>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Labs allow students to practice coding in an interactive environment
                </p>
                <Button>
                  Create Lab
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}