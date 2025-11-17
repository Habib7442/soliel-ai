import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, DollarSign, Globe, BookOpen, Users, Eye, AlertCircle, Video, FileText, Download, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default async function AdminCourseViewPage({ params }: { params: Promise<{ courseId: string }> }) {
  const supabase = await createServerClient();
  const { courseId } = await params;
  
  // Verify user is super admin
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== UserRole.SUPER_ADMIN) {
    redirect("/admin-dashboard");
  }
  
  // Fetch course details (no instructor ownership check)
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();
  
  if (error || !course) {
    console.error('Error fetching course:', error);
    redirect("/admin-courses");
  }

  // Fetch instructor details
  const { data: instructor } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('id', course.instructor_id)
    .single();

  // Fetch sections with lessons
  const { data: sections } = await supabase
    .from('course_sections')
    .select(`
      id,
      title,
      description,
      order_index,
      lessons (
        id,
        title,
        lesson_type,
        video_url,
        content_md,
        is_preview,
        order_index,
        duration_minutes,
        downloadable
      )
    `)
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });
  
  const lessonCount = sections?.reduce((total, section) => {
    return total + (section.lessons?.length || 0);
  }, 0) || 0;
  
  // Fetch enrollment count
  const { count: studentCount } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId);

  const getStatusBadge = () => {
    if (course.is_published) {
      return <Badge className="bg-green-500 text-white">Published</Badge>;
    }
    
    switch (course.status) {
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">Pending Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
      case 'archived':
        return <Badge className="bg-gray-500 text-white">Archived</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500 text-white">Approved</Badge>;
      default:
        return <Badge variant="outline">{course.status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/admin-courses">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course Management
            </Link>
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{course.title}</h1>
                {getStatusBadge()}
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Admin View
                </Badge>
              </div>
              {course.subtitle && (
                <p className="text-lg text-muted-foreground">{course.subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Rejection Reason Alert */}
        {course.status === 'rejected' && course.rejection_reason && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">Rejection Feedback</h3>
                  <p className="text-red-700 whitespace-pre-wrap">{course.rejection_reason}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Lessons</p>
                  <p className="text-2xl font-bold">{lessonCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Enrolled Students</p>
                  <p className="text-2xl font-bold">{studentCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold">${(course.price_cents / 100).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Eye className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold">{course.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thumbnail */}
            {course.thumbnail_url && (
              <Card>
                <CardContent className="pt-6">
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    width={800}
                    height={400}
                    className="w-full h-auto rounded-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Course Description</CardTitle>
              </CardHeader>
              <CardContent>
                {course.description ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{course.description}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No description provided</p>
                )}
              </CardContent>
            </Card>

            {/* Learning Outcomes */}
            {course.learning_outcomes && course.learning_outcomes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>What You&apos;ll Learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {course.learning_outcomes.map((outcome: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Curriculum */}
            <Card>
              <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
              </CardHeader>
              <CardContent>
                {sections && sections.length > 0 ? (
                  <div className="space-y-6">
                    {sections.map((section, index: number) => (
                      <div key={section.id} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-2">
                          Section {index + 1}: {section.title}
                        </h3>
                        {section.description && (
                          <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                        )}
                        {section.lessons && section.lessons.length > 0 ? (
                          <div className="space-y-3">
                            {section.lessons
                              .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                              .map((lesson, lessonIndex: number) => (
                              <div key={lesson.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-sm font-medium text-muted-foreground">
                                        {index + 1}.{lessonIndex + 1}
                                      </span>
                                      <h4 className="font-semibold">{lesson.title}</h4>
                                    </div>
                                    <div className="flex items-center gap-4 flex-wrap">
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        {lesson.lesson_type === 'video' ? (
                                          <>
                                            <Video className="h-3 w-3" />
                                            <span>Video Lesson</span>
                                          </>
                                        ) : (
                                          <>
                                            <FileText className="h-3 w-3" />
                                            <span>Text Lesson</span>
                                          </>
                                        )}
                                      </div>
                                      {lesson.duration_minutes && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Clock className="h-3 w-3" />
                                          <span>{lesson.duration_minutes} min</span>
                                        </div>
                                      )}
                                      {lesson.is_preview && (
                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                          Free Preview
                                        </Badge>
                                      )}
                                      {lesson.downloadable && (
                                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                          <Download className="h-3 w-3 mr-1" />
                                          Downloadable
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Video URL */}
                                {lesson.lesson_type === 'video' && lesson.video_url && (
                                  <div className="bg-white dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Video URL:</p>
                                    <a 
                                      href={lesson.video_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:underline break-all"
                                    >
                                      {lesson.video_url}
                                    </a>
                                  </div>
                                )}

                                {/* Text Content Preview */}
                                {lesson.lesson_type === 'text' && lesson.content_md && (
                                  <div className="bg-white dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Content Preview:</p>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                                      {lesson.content_md.substring(0, 200)}{lesson.content_md.length > 200 ? '...' : ''}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No lessons in this section</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No curriculum created yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructor Info */}
            <Card>
              <CardHeader>
                <CardTitle>Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {instructor?.avatar_url ? (
                    <Image
                      src={instructor.avatar_url}
                      alt={instructor.full_name || 'Instructor'}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{instructor?.full_name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{instructor?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Info */}
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Language:</span>
                  <span className="font-medium">{course.language || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Level:</span>
                  <span className="font-medium capitalize">{course.level || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(course.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Updated:</span>
                  <span className="font-medium">
                    {new Date(course.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Prerequisites */}
            {course.prerequisites && (
              <Card>
                <CardHeader>
                  <CardTitle>Prerequisites</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{course.prerequisites}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
