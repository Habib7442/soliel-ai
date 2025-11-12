import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LessonCreateForm } from "@/components/forms/lesson-create-form";

export default async function CourseCurriculumPage({ params }: { params: Promise<{ courseId: string }> }) {
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
  
  // Fetch lessons for this course
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index');
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground">Course Curriculum</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button asChild variant="outline">
              <Link href={`/instructor/courses/${courseId}`}>Back to Course</Link>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="lessons" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="labs">Labs</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="notes">Notes/Q&A</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lessons">
            <Card>
              <CardHeader>
                <CardTitle>Course Lessons</CardTitle>
                <CardDescription>Manage your course lessons (videos, PDFs, slides)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <LessonCreateForm courseId={courseId} />
                </div>
                
                {lessons && lessons.length > 0 ? (
                  <div className="space-y-4">
                    {lessons.map((lesson, index) => (
                      <div key={lesson.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold">Lesson {index + 1}: {lesson.title}</h3>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/instructor/courses/${courseId}/curriculum/lessons/${lesson.id}`}>Edit</Link>
                          </Button>
                        </div>
                        <p className="text-muted-foreground text-sm mt-2">
                          {lesson.content_md?.substring(0, 100)}...
                        </p>
                        <div className="flex items-center mt-2 text-sm text-muted-foreground">
                          <span className="mr-4">Video: {lesson.video_url ? 'Yes' : 'No'}</span>
                          <span>Downloadable: {lesson.downloadable ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No lessons created yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="labs">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Labs</CardTitle>
                <CardDescription>Manage your interactive coding environments and practice tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Labs management features will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
                <CardDescription>Manage assignments, submissions, and grading</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Assignments management features will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="quizzes">
            <Card>
              <CardHeader>
                <CardTitle>Quizzes</CardTitle>
                <CardDescription>Manage quizzes, questions, and scoring</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Quizzes management features will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Notes & Q&A</CardTitle>
                <CardDescription>Manage peer and instructor discussions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Notes and Q&A features will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Course Reviews</CardTitle>
                <CardDescription>Manage student feedback and ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Reviews management features will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Course FAQ</CardTitle>
                <CardDescription>Manage frequently asked questions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">FAQ management features will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}