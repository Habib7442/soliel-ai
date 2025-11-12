import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CourseQuizzesPage({ params }: { params: Promise<{ courseId: string }> }) {
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
  
  // Fetch quizzes for this course
  const { data: quizzes, error: quizzesError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground">Course Quizzes</p>
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
                <CardTitle>Quizzes</CardTitle>
                <CardDescription>Manage quizzes, questions, and scoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <Button>Create New Quiz</Button>
                </div>
                
                {quizzes && quizzes.length > 0 ? (
                  <div className="space-y-4">
                    {quizzes.map((quiz) => (
                      <div key={quiz.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold">{quiz.title}</h3>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/instructor/courses/${courseId}/quizzes/${quiz.id}`}>
                              Edit Quiz
                            </Link>
                          </Button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="text-sm text-muted-foreground">
                            <span>Questions: 0</span>
                          </div>
                          <div className="text-sm">
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              {quiz.is_final ? 'Final Quiz' : 'Practice Quiz'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No quizzes created yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quiz Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Total Quizzes</h3>
                    <p className="text-2xl font-bold">{quizzes?.length || 0}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Quiz Statistics</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Practice Quizzes</span>
                        <span>{quizzes?.filter(q => !q.is_final).length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Final Quizzes</span>
                        <span>{quizzes?.filter(q => q.is_final).length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Average Score</span>
                        <span>0%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Quiz Settings</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Configure quiz attempts, time limits, and scoring options
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