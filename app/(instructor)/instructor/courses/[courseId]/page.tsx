import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

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
  
  // Fetch lesson count
  const { count: lessonCount } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId);
  
  // Fetch sections with lessons
  const { data: sections } = await supabase
    .from('course_sections')
    .select('*, lessons(*)')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });
  
  // Fetch student count
  const { count: studentCount } = await supabase
    .from('course_purchases')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId);
  
  // Fetch average rating
  const { data: courseStats } = await supabase
    .from('course_stats')
    .select('average_rating, total_reviews')
    .eq('course_id', courseId)
    .single();
  
  const averageRating = courseStats?.average_rating || 0;
  
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
                    <div className="text-muted-foreground prose prose-sm max-w-none">
                      <ReactMarkdown>{course.description || ""}</ReactMarkdown>
                    </div>
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
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total Lessons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{lessonCount || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{studentCount || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Average Rating</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{averageRating.toFixed(1)}</p>
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
                    <CardDescription className="text-sm">Manage your course lessons and content</CardDescription>
                  </div>
                  <Button asChild size="sm" className="w-full md:w-auto text-xs md:text-sm">
                    <Link href={`/instructor/courses/${courseId}/curriculum`}>Add Section</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sections && sections.length > 0 ? (
                  <div className="space-y-6">
                    {sections.map((section, index) => (
                      <div key={section.id} className="border rounded-lg p-4 md:p-6">
                        <div className="mb-4">
                          <h3 className="text-base md:text-lg font-semibold mb-2">
                            {index + 1}) Section Title
                          </h3>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm md:text-base mb-1">
                                <span className="text-muted-foreground">Title -</span> {section.title}
                              </h4>
                              {section.description && (
                                <>
                                  <p className="text-xs md:text-sm">
                                    <span className="text-muted-foreground">Description -</span> {section.description}
                                  </p>
                                </>
                              )}
                            </div>
                            <Button asChild variant="outline" size="sm" className="flex-shrink-0 text-xs md:text-sm">
                              <Link href={`/instructor/courses/${courseId}/curriculum`}>Manage Section</Link>
                            </Button>
                          </div>
                        </div>
                        
                        {/* Lessons list */}
                        {section.lessons && section.lessons.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <h5 className="text-xs md:text-sm font-medium text-muted-foreground mb-3">Lessons ({section.lessons.length})</h5>
                            <div className="space-y-2">
                              {(section.lessons as Array<{
                                id: string;
                                title: string;
                                lesson_type: string;
                                is_preview: boolean;
                                order_index: number;
                              }>)
                                .sort((a, b) => a.order_index - b.order_index)
                                .map((lesson, lessonIndex: number) => (
                                <div key={lesson.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                    {lessonIndex + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs md:text-sm font-medium truncate">{lesson.title}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs capitalize">{lesson.lesson_type}</Badge>
                                      {lesson.is_preview && (
                                        <Badge variant="secondary" className="text-xs">Preview</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12">
                    <p className="text-sm md:text-base text-muted-foreground mb-4">No curriculum content yet</p>
                    <Button asChild size="sm">
                      <Link href={`/instructor/courses/${courseId}/curriculum`}>Add Your First Section</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
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