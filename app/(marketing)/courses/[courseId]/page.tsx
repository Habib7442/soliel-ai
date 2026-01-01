import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CourseFaqDisplay } from "@/components/course/CourseFaqDisplay";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { ReviewForm } from "@/components/course/ReviewForm";
import { ReviewsList } from "@/components/course/ReviewsList";
import { RatingSummary } from "@/components/course/RatingSummary";
import { getPublicCourse } from "@/server/actions/public.actions";
import { getCourseReviews, getUserReview } from "@/server/actions/review.actions";
import { createServerClient } from "@/lib/supabase-server";
import ReactMarkdown from "react-markdown";
import { Star, Users, Clock, BookOpen, Play, ChevronRight, Check, Lock, Award, Video } from "lucide-react";

interface CourseDetailsPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function CourseDetailsPage({ params }: CourseDetailsPageProps) {
  const { courseId } = await params;
  
  // Check if user is authenticated and enrolled
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let isEnrolled = false;
  if (user) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();
    
    isEnrolled = !!enrollment;
  }
  
  // Fetch course data
  const courseResult = await getPublicCourse(courseId);
  
  if (!courseResult.success || !courseResult.data) {
    console.error('Error fetching course:', courseResult.error);
    redirect("/courses");
  }
  
  const course = courseResult.data;
  
  // Fetch reviews
  const reviewsResult = await getCourseReviews(courseId);
  const reviews = reviewsResult.success ? reviewsResult.data : [];
  
  // Get user's review if enrolled
  let userReview = null;
  if (user && isEnrolled) {
    const userReviewResult = await getUserReview(user.id, courseId);
    userReview = userReviewResult.success ? userReviewResult.data : null;
  }
  
  // Calculate rating distribution
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews?.forEach((review: { rating: number }) => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    }
  });
  
  // Format price
  const formattedPrice = course.price_cents > 0 
    ? `$${(course.price_cents / 100).toFixed(2)}` 
    : 'Free';
  
  // Format duration
  const formattedDuration = course.estimated_duration_hours 
    ? `${course.estimated_duration_hours} hours` 
    : 'Self-paced';
  
  // Check if course is in a bundle
  const isInBundle = course.allow_in_bundles && (course.bundle_discount_percent || 0) > 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#FF0000] via-[#DD0000] to-[#CC0000] text-white">
        <div className="container mx-auto px-4 py-6">
          <Button 
            asChild 
            variant="ghost" 
            className="text-white hover:bg-white/20 mb-4 -ml-2"
          >
            <Link href="/courses">
              <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
              Back to Courses
            </Link>
          </Button>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 pb-8">
            {/* Left Content - 3 columns */}
            <div className="lg:col-span-3 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                    {course.level?.toUpperCase()}
                  </Badge>
                  {course.category && (
                    <Badge variant="outline" className="bg-white/10 border-white/30 text-white">
                      {course.category}
                    </Badge>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  {course.title}
                </h1>
                <p className="text-xl text-white/90 mb-6 leading-relaxed">
                  {course.subtitle}
                </p>
              </div>
              
              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                    <span className="ml-1.5 font-bold text-lg">
                      {course.stats.average_rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-white/70">({course.stats.total_reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <Users className="h-5 w-5" />
                  <span>{course.stats.total_enrollments.toLocaleString()} students</span>
                </div>
                {course.estimated_duration_hours && (
                  <div className="flex items-center gap-2 text-white/90">
                    <Clock className="h-5 w-5" />
                    <span>{course.estimated_duration_hours} hours</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-white/90">
                  <BookOpen className="h-5 w-5" />
                  <span>{course.lessons_count} lessons</span>
                </div>
              </div>
              
              {/* Instructor */}
              <div className="flex items-center gap-3 pt-2">
                {course.instructor?.avatar_url ? (
                  <Image 
                    src={course.instructor.avatar_url} 
                    alt={course.instructor.full_name || 'Instructor'}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/30">
                    <span className="text-sm font-semibold">
                      {course.instructor?.full_name?.charAt(0) || 'I'}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm text-white/70">Created by</p>
                  <p className="font-semibold">{course.instructor?.full_name || 'Unknown Instructor'}</p>
                </div>
              </div>
            </div>
            
            {/* Right Card - 2 columns */}
            <div className="lg:col-span-2">
              <Card className="bg-white dark:bg-gray-800 shadow-2xl">
                <CardContent className="p-6">
                  {course.thumbnail_url && (
                    <div className="rounded-lg overflow-hidden mb-6 shadow-md">
                      <Image 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        width={400}
                        height={225}
                        className="w-full object-cover aspect-video"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-sm text-muted-foreground">Price</span>
                        <p className="text-4xl font-bold text-[#FF0000]">{formattedPrice}</p>
                      </div>
                      {isInBundle && (
                        <Badge className="bg-green-500 text-white">
                          Save {course.bundle_discount_percent}%
                        </Badge>
                      )}
                    </div>
                    
                    <div className="pt-2 space-y-3">
                      {isEnrolled ? (
                        <Button 
                          asChild
                          size="lg"
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
                        >
                          <Link href={`/learn/${courseId}/player`}>
                            <Play className="h-5 w-5 mr-2" />
                            Continue Learning
                          </Link>
                        </Button>
                      ) : (
                        <Button 
                          asChild
                          size="lg"
                          className="w-full bg-gradient-to-r from-[#FF0000] to-[#CC0000] hover:opacity-90 text-white shadow-lg text-lg py-6"
                        >
                          <Link href={`/checkout?courseId=${courseId}`}>
                            Enroll Now
                          </Link>
                        </Button>
                      )}
                      
                      {isInBundle && !isEnrolled && (
                        <Button 
                          variant="outline" 
                          size="lg"
                          className="w-full border-2 border-[#FF0000] text-[#FF0000] hover:bg-[#FF0000]/10"
                        >
                          See in Bundle
                        </Button>
                      )}
                    </div>
                    
                    <div className="border-t pt-4 mt-4 space-y-3">
                      <p className="text-sm font-semibold mb-2">This course includes:</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Video className="h-4 w-4" />
                          <span>{course.estimated_duration_hours || 0} hours on-demand video</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <BookOpen className="h-4 w-4" />
                          <span>{course.lessons_count} lectures</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Award className="h-4 w-4" />
                          <span>Certificate of completion</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Intro Video - Always visible */}
            {course.intro_video_url && (
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Play className="h-6 w-6 text-[#FF0000]" />
                    Course Preview
                  </CardTitle>
                  <CardDescription>
                    Get a sneak peek of what you&apos;ll learn in this course
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VideoPlayer url={course.intro_video_url} title={`${course.title} - Preview`} />
                </CardContent>
              </Card>
            )}
            
            {/* What You'll Learn - Always visible */}
            {course.learning_outcomes && course.learning_outcomes.length > 0 && (
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl">What You&apos;ll Learn</CardTitle>
                  <CardDescription>
                    Skills and knowledge you&apos;ll gain from this course
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {course.learning_outcomes.map((outcome, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Description - Always visible */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl">Course Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-[#FF0000] prose-a:text-[#FF0000]">
                  <ReactMarkdown>{course.description || ""}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
            
            {/* Prerequisites - Always visible */}
            {course.prerequisites && (
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl">Prerequisites</CardTitle>
                  <CardDescription>
                    What you need to know before starting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{course.prerequisites}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Course Content - Show only preview lessons for non-enrolled users */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <BookOpen className="h-6 w-6 text-[#FF0000]" />
                      Course Content
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {course.sections?.length || 0} sections • {course.lessons_count} lessons
                      {!isEnrolled && " • Preview available lessons"}
                    </CardDescription>
                  </div>
                  {!isEnrolled && (
                    <Badge variant="outline" className="border-[#FF0000] text-[#FF0000]">
                      <Lock className="h-3 w-3 mr-1" />
                      Enroll to unlock
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {course.sections && course.sections.length > 0 ? (
                    course.sections.map((section) => {
                      const previewLessons = section.lessons?.filter(l => l.is_preview) || [];
                      const lockedLessons = section.lessons?.filter(l => !l.is_preview) || [];
                      
                      // Show section only if enrolled or has preview lessons
                      if (!isEnrolled && previewLessons.length === 0) return null;
                      
                      return (
                        <Accordion type="single" collapsible key={section.id} className="border rounded-lg">
                          <AccordionItem value={section.id} className="border-none">
                            <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="text-left">
                                  <h3 className="text-base font-semibold">{section.title}</h3>
                                  {section.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {section.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  {!isEnrolled && lockedLessons.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Lock className="h-3 w-3 mr-1" />
                                      {lockedLessons.length} locked
                                    </Badge>
                                  )}
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <BookOpen className="h-4 w-4 mr-1" />
                                    <span>{section.lessons?.length || 0} lessons</span>
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-2 pt-2">
                                {/* Show preview lessons */}
                                {previewLessons.map((lesson) => (
                                  <div key={lesson.id} className="space-y-3">
                                    <div 
                                      className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20 dark:to-transparent rounded-lg border border-green-200 dark:border-green-800"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                          <Play className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                          <p className="font-medium text-sm">{lesson.title}</p>
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                            <span className="capitalize">{lesson.lesson_type}</span>
                                            {lesson.duration_minutes && (
                                              <>
                                                <span>•</span>
                                                <span>{lesson.duration_minutes} min</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <Badge className="bg-green-500 text-white border-green-600">
                                        Preview
                                      </Badge>
                                    </div>
                                    {/* Show video player for preview lessons with video URLs */}
                                    {lesson.video_url && lesson.lesson_type === 'video' && (
                                      <div className="pl-11">
                                        <VideoPlayer url={lesson.video_url} title={lesson.title} />
                                      </div>
                                    )}
                                  </div>
                                ))}
                                
                                {/* Show locked lessons for non-enrolled users */}
                                {!isEnrolled && lockedLessons.slice(0, 3).map((lesson) => (
                                  <div 
                                    key={lesson.id} 
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg opacity-60"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <Lock className="h-4 w-4 text-gray-400" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">{lesson.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                          <span className="capitalize">{lesson.lesson_type}</span>
                                          {lesson.duration_minutes && (
                                            <>
                                              <span>•</span>
                                              <span>{lesson.duration_minutes} min</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <Lock className="h-4 w-4 text-gray-400" />
                                  </div>
                                ))}
                                
                                {/* Show all lessons for enrolled users */}
                                {isEnrolled && lockedLessons.map((lesson) => (
                                  <div 
                                    key={lesson.id} 
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-[#FF0000]/10 flex items-center justify-center">
                                        <Play className="h-4 w-4 text-[#FF0000]" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">{lesson.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                          <span className="capitalize">{lesson.lesson_type}</span>
                                          {lesson.duration_minutes && (
                                            <>
                                              <span>•</span>
                                              <span>{lesson.duration_minutes} min</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                
                                {!isEnrolled && lockedLessons.length > 3 && (
                                  <div className="text-center py-4">
                                    <p className="text-sm text-muted-foreground">
                                      +{lockedLessons.length - 3} more lessons
                                    </p>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No content available yet.</p>
                  )}
                  
                  {!isEnrolled && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-[#FF0000]/5 to-[#CC0000]/5 dark:from-[#FF0000]/10 dark:to-[#CC0000]/10 rounded-lg border border-[#FF0000]/20 text-center">
                      <Lock className="h-12 w-12 mx-auto mb-3 text-[#FF0000]" />
                      <h3 className="font-semibold text-lg mb-2">Unlock Full Course Content</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Enroll now to access all {course.lessons_count} lessons and start learning
                      </p>
                      <Button 
                        asChild
                        className="bg-gradient-to-r from-[#FF0000] to-[#CC0000] hover:opacity-90 text-white"
                      >
                        <Link href={`/checkout?courseId=${courseId}`}>
                          Enroll Now - {formattedPrice}
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* FAQ - Only show for enrolled users or hide completely */}
            {isEnrolled && <CourseFaqDisplay courseId={courseId} />}
          </div>
          
          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Course Info */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Level
                  </span>
                  <Badge variant="outline" className="capitalize">{course.level}</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Language</span>
                  <span className="font-medium">{course.language}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duration
                  </span>
                  <span className="font-medium">{formattedDuration}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Lessons
                  </span>
                  <span className="font-medium">{course.lessons_count}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Enrolled</span>
                  <span className="font-medium">{course.stats.total_enrollments.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Reviews Section */}
            <Card className="shadow-md mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">Student Reviews</CardTitle>
                <CardDescription>
                  {course.stats.total_reviews > 0 
                    ? `See what students are saying about this course`
                    : `Be the first to review this course`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Rating Summary */}
                {course.stats.total_reviews > 0 && (
                  <RatingSummary 
                    averageRating={course.stats.average_rating} 
                    totalReviews={course.stats.total_reviews}
                    ratingDistribution={ratingDistribution}
                  />
                )}
                
                {/* Review Form - Only for enrolled students */}
                {isEnrolled && user && (
                  <div>
                    <ReviewForm 
                      courseId={courseId} 
                      userId={user.id}
                      existingReview={userReview}
                    />
                  </div>
                )}
                
                {/* Reviews List */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {course.stats.total_reviews > 0 ? 'All Reviews' : 'No reviews yet'}
                  </h3>
                  <ReviewsList reviews={(reviews || []) as never[]} />
                </div>

              </CardContent>
            </Card>
            
            {/* Instructor */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  {course.instructor?.avatar_url ? (
                    <Image 
                      src={course.instructor.avatar_url} 
                      alt={course.instructor.full_name || 'Instructor'}
                      width={60}
                      height={60}
                      className="w-15 h-15 rounded-full object-cover ring-2 ring-[#FF0000]/20"
                    />
                  ) : (
                    <div className="w-15 h-15 rounded-full bg-gradient-to-br from-[#FF0000] to-[#CC0000] flex items-center justify-center ring-2 ring-[#FF0000]/20">
                      <span className="text-xl font-bold text-white">
                        {course.instructor?.full_name?.charAt(0) || 'I'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{course.instructor?.full_name || 'Unknown Instructor'}</p>
                    <p className="text-sm text-muted-foreground mb-3">Course Instructor</p>
                    
                    {course.instructor?.bio_md && isEnrolled && (
                      <div className="mt-3 text-sm text-muted-foreground line-clamp-3">
                        {course.instructor.bio_md.substring(0, 150)}...
                      </div>
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