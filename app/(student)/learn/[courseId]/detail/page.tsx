import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { CourseFaqDisplay } from "@/components/course/CourseFaqDisplay";
import { ChevronLeft, Star, Users, Clock, BookOpen } from "lucide-react";

interface LessonCount {
  count: number;
}

interface CourseDetailPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params;
  
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Fetch course data with instructor info
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      profiles!courses_instructor_id_fkey (
        full_name,
        avatar_url
      )
    `)
    .eq('id', courseId)
    .single();
  
  if (error || !course) {
    console.error('Error fetching course:', error);
    redirect("/student-dashboard");
  }
  
  // Check if student is enrolled
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single();
  
  // Fetch course stats
  const { data: courseStats } = await supabase
    .from('course_stats')
    .select('average_rating, total_reviews, total_enrollments')
    .eq('course_id', courseId)
    .single();
  
  // Fetch sections with lessons count
  const { data: sections } = await supabase
    .from('course_sections')
    .select(`
      *,
      lessons(count)
    `)
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });
  
  const totalLessons = sections?.reduce((acc, section) => {
    return acc + (section.lessons as LessonCount)?.count || 0;
  }, 0) || 0;
  
  const averageRating = courseStats?.average_rating || 0;
  const totalReviews = courseStats?.total_reviews || 0;
  const totalEnrollments = courseStats?.total_enrollments || 0;
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/student-dashboard">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {course.thumbnail_url && (
                    <div className="md:w-1/3">
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="w-full rounded-lg object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2">
                      {course.level}
                    </Badge>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">{course.title}</h1>
                    <p className="text-muted-foreground mb-4">{course.subtitle}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        <span className="ml-1 font-medium">{averageRating.toFixed(1)}</span>
                        <span className="mx-1 text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{totalReviews} reviews</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span className="ml-1 text-muted-foreground">{totalEnrollments} students</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground mb-4">
                      <span>By {course.profiles?.full_name || 'Unknown Instructor'}</span>
                    </div>
                    
                    {enrollment ? (
                      <Button asChild>
                        <Link href={`/learn/${courseId}/player`}>Continue Learning</Link>
                      </Button>
                    ) : (
                      <Button asChild>
                        <Link href={`/courses/${courseId}/enroll`}>Enroll Now</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Course Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{course.description || ""}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
            
            {/* Course Content */}
            <Card>
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
                <CardDescription>
                  {sections?.length || 0} sections • {totalLessons} lessons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sections && sections.length > 0 ? (
                    sections.map((section) => (
                      <div key={section.id} className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">{section.title}</h3>
                        {section.description && (
                          <p className="text-sm text-muted-foreground mb-3">{section.description}</p>
                        )}
                        <div className="flex items-center text-sm text-muted-foreground">
                          <BookOpen className="h-4 w-4 mr-1" />
                          <span>{(section.lessons as LessonCount)?.count || 0} lessons</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No content available yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Course FAQ */}
            <CourseFaqDisplay courseId={courseId} />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Info */}
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Level</span>
                  <span className="font-medium capitalize">{course.level}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Language</span>
                  <span className="font-medium">{course.language}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">
                    {course.estimated_duration_hours 
                      ? `${course.estimated_duration_hours} hours` 
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">
                    {course.price_cents > 0 
                      ? `$${(course.price_cents / 100).toFixed(2)}` 
                      : 'Free'}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Instructor */}
            <Card>
              <CardHeader>
                <CardTitle>Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {course.profiles?.avatar_url ? (
                    <img 
                      src={course.profiles.avatar_url} 
                      alt={course.profiles.full_name || 'Instructor'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-semibold">
                        {course.profiles?.full_name?.charAt(0) || 'I'}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{course.profiles?.full_name || 'Unknown Instructor'}</p>
                    <p className="text-sm text-muted-foreground">Course Instructor</p>
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