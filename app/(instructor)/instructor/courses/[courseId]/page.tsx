import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface CourseManagePageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function CourseManagePage({ params }: CourseManagePageProps) {
  const { courseId } = await params;
  
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== UserRole.INSTRUCTOR && profile?.role !== UserRole.SUPER_ADMIN) {
    redirect("/sign-in");
  }
  
  // Fetch course data
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .eq('instructor_id', user.id)
    .single();
  
  if (error || !course) {
    console.error('Error fetching course:', error);
    redirect("/instructor-dashboard");
  }
  
  return (
    <div className="min-h-screen md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold mb-2 truncate">{course.title}</h1>
              <p className="text-sm md:text-base text-muted-foreground line-clamp-2">{course.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <Badge variant={course.is_published ? "default" : "secondary"} className="text-xs md:text-sm">
                {course.is_published ? "Published" : course.status}
              </Badge>
              <Button asChild variant="outline" size="sm" className="text-xs md:text-sm">
                <Link href="/instructor-dashboard">Back</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Course Management Tabs */}
        <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 gap-1 h-auto p-1">
            <TabsTrigger value="overview" className="text-xs md:text-sm py-2 px-2 md:px-4">Overview</TabsTrigger>
            <TabsTrigger value="curriculum" className="text-xs md:text-sm py-2 px-2 md:px-4">Curriculum</TabsTrigger>
            <TabsTrigger value="quizzes" className="text-xs md:text-sm py-2 px-2 md:px-4">Quizzes</TabsTrigger>
            <TabsTrigger value="assignments" className="text-xs md:text-sm py-2 px-2 md:px-4">Assignments</TabsTrigger>
            <TabsTrigger value="faq" className="text-xs md:text-sm py-2 px-2 md:px-4 md:col-start-auto col-start-1">FAQ</TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs md:text-sm py-2 px-2 md:px-4">Reviews</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs md:text-sm py-2 px-2 md:px-4">Q&A</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Details</CardTitle>
                  <CardDescription>Basic information about your course</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-1">Description</h3>
                    <p className="text-muted-foreground">{course.description}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <h3 className="font-semibold mb-1">Level</h3>
                      <p className="text-muted-foreground capitalize">{course.level}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Language</h3>
                      <p className="text-muted-foreground">{course.language}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Price</h3>
                      <p className="text-muted-foreground">${(course.price_cents / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Status</h3>
                      <p className="text-muted-foreground capitalize">{course.is_published ? 'Published' : course.status}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    <Button asChild className="w-full sm:w-auto">
                      <Link href={`/instructor/courses/${courseId}/edit`}>Edit Course</Link>
                    </Button>
                    {!course.is_published && (
                      <Button variant="outline" className="w-full sm:w-auto">
                        Submit for Review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total Lessons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">0</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">0</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Average Rating</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">0.0</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg md:text-xl">Course Curriculum</CardTitle>
                    <CardDescription className="text-sm">Manage lessons and course content</CardDescription>
                  </div>
                  <Button asChild size="sm" className="w-full md:w-auto text-xs md:text-sm">
                    <Link href={`/instructor/courses/${courseId}/curriculum`}>Manage Curriculum</Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg md:text-xl">Quizzes</CardTitle>
                    <CardDescription className="text-sm">Create and manage course quizzes</CardDescription>
                  </div>
                  <Button asChild size="sm" className="w-full md:w-auto text-xs md:text-sm">
                    <Link href={`/instructor/courses/${courseId}/quizzes`}>Manage Quizzes</Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg md:text-xl">Assignments</CardTitle>
                    <CardDescription className="text-sm">Create and grade student assignments</CardDescription>
                  </div>
                  <Button asChild size="sm" className="w-full md:w-auto text-xs md:text-sm">
                    <Link href={`/instructor/courses/${courseId}/assignments`}>Manage Assignments</Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg md:text-xl">Course FAQs</CardTitle>
                    <CardDescription className="text-sm">Frequently asked questions for this course</CardDescription>
                  </div>
                  <Button asChild size="sm" className="w-full md:w-auto text-xs md:text-sm">
                    <Link href={`/instructor/courses/${courseId}/faq`}>Manage FAQs</Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg md:text-xl">Student Reviews</CardTitle>
                    <CardDescription className="text-sm">View and respond to student feedback</CardDescription>
                  </div>
                  <Button asChild size="sm" className="w-full md:w-auto text-xs md:text-sm">
                    <Link href={`/instructor/courses/${courseId}/reviews`}>View All Reviews</Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </TabsContent>

          {/* Notes/Q&A Tab */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg md:text-xl">Q&A Threads</CardTitle>
                    <CardDescription className="text-sm">Student questions and discussions</CardDescription>
                  </div>
                  <Button asChild size="sm" className="w-full md:w-auto text-xs md:text-sm">
                    <Link href={`/instructor/courses/${courseId}/notes`}>View Discussions</Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
