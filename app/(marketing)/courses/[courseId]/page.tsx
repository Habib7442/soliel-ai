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
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      {/* Navbar Placeholder - Assuming Navbar is handled in layout */}
      
      {/* Breadcrumb / Back Link Area */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <Link 
            href="/courses" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
            Back to Courses
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* LEFT COLUMN - Main Content */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Header Info (Mobile/Desktop) */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent rounded-full px-3">
                  {course.level?.toUpperCase()}
                </Badge>
                {course.category && (
                  <Badge variant="outline" className="rounded-full px-3">
                    {course.category}
                  </Badge>
                )}
                {isInBundle && (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white rounded-full px-3">
                    Bundle Deal Available
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                {course.title}
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                {course.subtitle}
              </p>
              
              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100 font-medium">
                  <span className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="ml-1">{course.stats.average_rating.toFixed(1)}</span>
                  </span>
                  <span className="text-muted-foreground font-normal underline decoration-dotted underline-offset-4">
                    ({course.stats.total_reviews} reviews)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>{course.stats.total_enrollments.toLocaleString()} students</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>Last updated {new Date(course.updated_at || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>

               {/* Instructor Mini Profile */}
               <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                {course.instructor?.avatar_url ? (
                  <Image 
                    src={course.instructor.avatar_url} 
                    alt={course.instructor.full_name || 'Instructor'}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-gray-100 dark:ring-gray-800">
                    <span className="text-sm font-semibold text-primary">
                      {course.instructor?.full_name?.charAt(0) || 'I'}
                    </span>
                  </div>
                )}
                <div className="text-sm">
                  <p className="text-muted-foreground">Created by</p>
                  <Link href="#instructor" className="font-semibold text-primary hover:underline">
                    {course.instructor?.full_name || 'Unknown Instructor'}
                  </Link>
                </div>
              </div>
            </div>

            {/* Video Preview (if available) - moved to main column for better flow */}
            {course.intro_video_url && (
               <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800">
                 <VideoPlayer url={course.intro_video_url} title={`${course.title} - Preview`} />
               </div>
            )}
            
            {/* What You'll Learn */}
            {course.learning_outcomes && course.learning_outcomes.length > 0 && (
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-6">What you&apos;ll learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.learning_outcomes.map((outcome, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Course Content Accordion */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Course Content</h2>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <div className="flex gap-4">
                   <span>{course.sections?.length || 0} sections</span>
                   <span>•</span>
                   <span>{course.lessons_count} lessons</span>
                   <span>•</span>
                   <span>{formattedDuration} total length</span>
                </div>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800/30">
                 {course.sections && course.sections.length > 0 ? (
                    course.sections.map((section) => {
                      const previewLessons = section.lessons?.filter(l => l.is_preview) || [];
                      const lockedLessons = section.lessons?.filter(l => !l.is_preview) || [];
                       // Only show previews if not enrolled
                      const lessonsToShow = isEnrolled ? section.lessons || [] : [...previewLessons, ...lockedLessons];
                       
                      if (!isEnrolled && previewLessons.length === 0 && lockedLessons.length === 0) return null;

                      return (
                        <Accordion type="single" collapsible key={section.id} className="border-b last:border-0 border-gray-100 dark:border-gray-700/50">
                          <AccordionItem value={section.id} className="border-none">
                            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                              <div className="text-left w-full pr-4">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{section.title}</h3>
                                {section.description && (
                                    <p className="text-xs text-muted-foreground font-normal mt-0.5 line-clamp-1">{section.description}</p>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground font-normal whitespace-nowrap ml-2">
                                {section.lessons?.length || 0} lectures
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="px-0 pb-0 bg-gray-50/30 dark:bg-gray-900/30">
                              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {lessonsToShow.map((lesson) => (
                                  <div key={lesson.id} className={`flex items-center justify-between py-3 px-6 ${!isEnrolled && !lesson.is_preview ? 'opacity-60' : 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'}`}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                       {lesson.lesson_type === 'video' ? (
                                         <Play className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                       ) : (
                                         <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                       )}
                                       <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                         {lesson.title}
                                       </span>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                      {lesson.is_preview && !isEnrolled ? (
                                        <span className="text-xs font-semibold text-primary">Preview</span>
                                      ) : !isEnrolled ? (
                                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                      ) : null}
                                      <span className="text-xs text-muted-foreground w-12 text-right">
                                        {lesson.duration_minutes ? `${lesson.duration_minutes}m` : ''}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      );
                    })
                 ) : (
                   <div className="p-8 text-center text-muted-foreground">No content uploaded yet.</div>
                 )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
               <h2 className="text-2xl font-bold">Description</h2>
               <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl">
                  <ReactMarkdown>{course.description || "No description provided."}</ReactMarkdown>
               </div>
            </div>
            
            {/* Prerequisites */}
            {(course.prerequisites) && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Requirements</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none text-sm">
                   <ReactMarkdown>{course.prerequisites}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Instructor Details */}
            <div id="instructor" className="space-y-6 pt-8 border-t border-gray-200 dark:border-gray-800">
               <h2 className="text-2xl font-bold">Instructor</h2>
               <div className="flex flex-col sm:flex-row gap-6">
                 <div className="flex-shrink-0">
                    {course.instructor?.avatar_url ? (
                      <Image 
                        src={course.instructor.avatar_url} 
                        alt={course.instructor.full_name || 'Instructor'}
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                        <span className="text-3xl font-bold text-primary">
                          {course.instructor?.full_name?.charAt(0) || 'I'}
                        </span>
                      </div>
                    )}
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-xl font-bold text-primary underline decoration-2 underline-offset-4 decoration-primary/20">
                      {course.instructor?.full_name || "Course Instructor"}
                    </h3>
                    <p className="text-muted-foreground font-medium">Head Instructor • Senior Developer</p>
                    {course.instructor?.bio_md && (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground mt-4">
                         <ReactMarkdown>{course.instructor.bio_md}</ReactMarkdown>
                      </div>
                    )}
                 </div>
               </div>
            </div>

             {/* Reviews */}
             <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
                <h2 className="text-2xl font-bold mb-6">Student Feedback</h2>
                
                {/* Rating Summary Block */}
                <div className="grid md:grid-cols-12 gap-8 mb-10">
                   <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
                      <div className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
                        {course.stats.average_rating.toFixed(1)}
                      </div>
                      <div className="flex mb-2">
                         {[1, 2, 3, 4, 5].map((star) => (
                           <Star 
                             key={star} 
                             className={`w-5 h-5 ${star <= Math.round(course.stats.average_rating) ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} 
                           />
                         ))}
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">Course Rating</p>
                   </div>
                   
                   <div className="md:col-span-8">
                      {/* Using the component but ignoring the passed props for simple custom UI here or reuse component with wrapper */}
                       <div className="space-y-2">
                           {[5, 4, 3, 2, 1].map((rating) => {
                             const count = ratingDistribution[rating as keyof typeof ratingDistribution] || 0;
                             const percentage = course.stats.total_reviews > 0 ? (count / course.stats.total_reviews) * 100 : 0;
                             return (
                               <div key={rating} className="flex items-center gap-3 text-sm">
                                  <div className="w-12 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex-1">
                                     <div className="h-full bg-gray-900 dark:bg-gray-400 rounded-full" style={{ width: `${percentage}%` }} />
                                  </div>
                                  <div className="flex items-center gap-1 min-w-[60px]">
                                     <div className="flex text-yellow-500">
                                       <Star className="w-3.5 h-3.5 fill-current" />
                                       <Star className="w-3.5 h-3.5 fill-current" />
                                       <Star className="w-3.5 h-3.5 fill-current" />
                                       <Star className="w-3.5 h-3.5 fill-current" />
                                       <Star className="w-3.5 h-3.5 fill-current" />
                                     </div>
                                     <span className="text-muted-foreground ml-2 text-xs">{percentage.toFixed(0)}%</span>
                                  </div>
                               </div>
                             )
                           })}
                       </div>
                   </div>
                </div>

                {/* Review Form */}
                {isEnrolled && user && (
                    <div className="mb-10">
                      <ReviewForm 
                        courseId={courseId} 
                        userId={user.id}
                        existingReview={userReview}
                      />
                    </div>
                )}
                
                {/* Reviews List */}
                <ReviewsList reviews={(reviews || []) as never[]} />
             </div>

          </div>
          
          {/* RIGHT COLUMN - Sticky Sidebar */}
          <div className="lg:col-span-4 relative">
             <div className="sticky top-24 space-y-6">
                {/* Enrollment Card */}
                <Card className="overflow-hidden border-0 shadow-xl ring-1 ring-gray-200 dark:ring-gray-800 bg-white dark:bg-gray-900 rounded-2xl">
                   {/* Thumbnail (if video preview exists, maybe hide this or change logic) -> Kept for consistent card UI */}
                   {course.thumbnail_url && !course.intro_video_url && (
                     <div className="relative aspect-video w-full overflow-hidden">
                       <Image 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10" />
                     </div>
                   )}
                   
                   <CardContent className="p-6">
                      <div className="flex items-end gap-3 mb-6">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                           {formattedPrice}
                        </span>
                        {isInBundle && (
                          <span className="text-sm text-muted-foreground line-through mb-1.5">
                            ${(course.price_cents * 1.2 / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        {isEnrolled ? (
                          <Button 
                            asChild
                            size="lg"
                            className="w-full bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-xl h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                          >
                            <Link href={`/learn/${courseId}/player`}>
                              Continue Learning
                            </Link>
                          </Button>
                        ) : (
                          <Button 
                            asChild
                            size="lg"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                          >
                            <Link href={`/checkout?courseId=${courseId}`}>
                              Enroll Now
                            </Link>
                          </Button>
                        )}
                      </div>
                      
                      <div className="mt-8 space-y-4">
                         <h4 className="font-semibold text-sm text-gray-900 dark:text-white">This course includes:</h4>
                         <ul className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-center gap-3">
                               <Video className="w-4 h-4 text-gray-400" />
                               <span>{formattedDuration} on-demand video</span>
                            </li>
                            <li className="flex items-center gap-3">
                               <BookOpen className="w-4 h-4 text-gray-400" />
                               <span>{course.lessons_count} downloadable resources</span>
                            </li>
                            <li className="flex items-center gap-3">
                               <Award className="w-4 h-4 text-gray-400" />
                               <span>Certificate of completion</span>
                            </li>
                            <li className="flex items-center gap-3">
                               <Lock className="w-4 h-4 text-gray-400" />
                               <span>Full lifetime access</span>
                            </li>
                         </ul>
                      </div>
                   </CardContent>
                   <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-t border-gray-100 dark:border-gray-800 text-center">
                     <p className="text-xs text-muted-foreground font-medium">30-Day Money-Back Guarantee</p>
                   </div>
                </Card>
                
                {/* Meta Info (Badges) */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 shadow-sm">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Skill Level</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{course.level}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Language</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{course.language}</span>
                   </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Captions</span>
                      <span className="font-medium text-gray-900 dark:text-white">Yes</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}