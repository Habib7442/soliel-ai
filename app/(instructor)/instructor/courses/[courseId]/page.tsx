import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const supabase = await createServerClient();
  
  // Unwrap params
  const { courseId } = await params;
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Fetch course details
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();
  
  if (error || !course) {
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
            <p className="text-muted-foreground">{course.subtitle}</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button asChild variant="outline">
              <Link href={`/instructor/courses/${courseId}/curriculum`}>Edit Curriculum</Link>
            </Button>
            <Button asChild>
              <Link href={`/instructor/courses/${courseId}/pricing`}>Course Settings</Link>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
                <CardDescription>Basic information about your course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">Description</h3>
                    <p className="text-muted-foreground">{course.description}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Details</h3>
                    <ul className="text-muted-foreground space-y-1">
                      <li>Level: {course.level}</li>
                      <li>Language: {course.language}</li>
                      <li>Price: ₹{(course.price_cents / 100).toFixed(2)}</li>
                      <li>Status: <span className="capitalize">{course.status}</span></li>
                      <li>Published: {course.is_published ? 'Yes' : 'No'}</li>
                    </ul>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3">Course Management</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Button asChild variant="outline">
                      <Link href={`/instructor/courses/${courseId}/curriculum`}>Lessons</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/instructor/courses/${courseId}/labs`}>Labs</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/instructor/courses/${courseId}/assignments`}>Assignments</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/instructor/courses/${courseId}/quizzes`}>Quizzes</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/instructor/courses/${courseId}/notes`}>Notes/Q&A</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/instructor/courses/${courseId}/reviews`}>Reviews</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/instructor/courses/${courseId}/faq`}>Course FAQ</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="curriculum">
            <Card>
              <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
                <CardDescription>Manage your course sections and lessons</CardDescription>
              </CardHeader>
              <CardContent>
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
                    <Button asChild>
                      <Link href={`/instructor/courses/${courseId}/curriculum`}>Create First Lesson</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>View and manage your students</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Student management features will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Course Analytics</CardTitle>
                <CardDescription>Track your course performance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics dashboard will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}