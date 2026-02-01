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
import { Star, Users, Clock, BookOpen, Play, ChevronRight, Check, Lock, Award, Video, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen relative overflow-hidden bg-white selection:bg-primary selection:text-white">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/2 left-0 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] -z-10" />

      {/* Breadcrumb Area */}
      <div className="relative z-10 border-b border-gray-100/50">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <Link 
            href="/courses" 
            className="group inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronRight className="h-4 w-4 rotate-180 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Catalog
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20">
          
          {/* LEFT COLUMN - Main Content */}
          <div className="lg:col-span-8 space-y-16">
            
            {/* Header Info */}
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-4">
                <Badge className="bg-primary/10 text-primary border-0 hover:bg-primary/20 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
                  {course.level} level
                </Badge>
                {course.category && (
                  <Badge className="bg-gray-100 text-gray-500 border-0 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {course.category}
                  </Badge>
                )}
                {isInBundle && (
                  <Badge className="bg-black text-white border-0 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse">
                    Bundle Offer
                  </Badge>
                )}
              </div>
              
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.1]">
                {course.title}
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground/80 font-medium leading-relaxed max-w-3xl">
                {course.subtitle}
              </p>
              
              {/* Stats & Instructor */}
              <div className="flex flex-wrap items-center gap-x-10 gap-y-6 pt-4">
                <div className="flex items-center gap-4">
                  <div className="flex text-yellow-500">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="ml-2 text-lg font-black text-gray-900">{course.stats.average_rating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    ({course.stats.total_reviews} REVIEWS)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">{course.stats.total_enrollments.toLocaleString()} ENROLLED</span>
                </div>

                <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                  <div className="w-10 h-10 rounded-2xl bg-gray-100 overflow-hidden border-2 border-white shadow-sm">
                    {course.instructor?.avatar_url ? (
                      <Image src={course.instructor.avatar_url} alt={course.instructor.full_name || ""} width={40} height={40} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-400">
                        {course.instructor?.full_name?.charAt(0) || "I"}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Expert Mentor</span>
                    <span className="text-sm font-black text-gray-900 hover:text-primary transition-colors cursor-pointer">{course.instructor?.full_name || "Anonymous"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Preview */}
            {course.intro_video_url && (
               <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-black/10 border border-white/50 backdrop-blur-xl group">
                 <VideoPlayer url={course.intro_video_url} title={`${course.title} - Preview`} />
               </div>
            )}
            
            {/* What You'll Learn */}
            {course.learning_outcomes && course.learning_outcomes.length > 0 && (
              <div className="bg-white/50 backdrop-blur-xl rounded-[3rem] border border-white/50 p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <h2 className="text-3xl font-black tracking-tight mb-8">What you&apos;ll <span className="text-primary italic">achieve.</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                  {course.learning_outcomes.map((outcome, index) => (
                    <div key={index} className="flex items-start gap-4 group">
                      <div className="mt-1 w-6 h-6 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:rotate-12 transition-all duration-300">
                        <Check className="h-3.5 w-3.5 text-primary group-hover:text-white" />
                      </div>
                      <span className="text-gray-700 font-medium text-base leading-relaxed">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Course Content */}
            <div className="space-y-10">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-tight mb-2">Curriculum.</h2>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    {course.sections?.length || 0} SECTIONS • {course.lessons_count} MODULES • {formattedDuration} CONTENT
                  </p>
                </div>
              </div>
              
              <div className="bg-white/50 backdrop-blur-xl rounded-[3rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                 {course.sections && course.sections.length > 0 ? (
                    course.sections.map((section, sIdx) => {
                      const lessonsToShow = section.lessons || [];
                      if (!isEnrolled && lessonsToShow.length === 0) return null;

                      return (
                        <Accordion type="single" collapsible key={section.id} className="border-b last:border-0 border-gray-100/50">
                          <AccordionItem value={section.id} className="border-none">
                            <AccordionTrigger className="px-10 py-8 hover:bg-gray-50/50 transition-colors [&[data-state=open]]:bg-gray-50/50">
                              <div className="flex items-center gap-6 text-left w-full">
                                <span className="text-4xl font-black text-gray-100 tabular-nums">{(sIdx + 1).toString().padStart(2, '0')}</span>
                                <div>
                                  <h3 className="text-xl font-black text-gray-900 leading-tight">{section.title}</h3>
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                    {section.lessons?.length || 0} MODULES
                                  </p>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-0 pb-0 bg-gray-50/30">
                              <div className="divide-y divide-gray-100/50">
                                {lessonsToShow.map((lesson) => (
                                  <div key={lesson.id} className={`flex items-center justify-between py-6 px-10 pl-24 transition-all ${!isEnrolled && !lesson.is_preview ? 'opacity-50' : 'hover:bg-white group/lesson'}`}>
                                    <div className="flex items-center gap-4 overflow-hidden">
                                       <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 group-hover/lesson:scale-110 transition-transform">
                                          {lesson.lesson_type === 'video' ? (
                                            <Play className="h-4 w-4 text-primary fill-current" />
                                          ) : (
                                            <BookOpen className="h-4 w-4 text-gray-400" />
                                          )}
                                       </div>
                                       <span className="text-base font-bold text-gray-700 group-hover/lesson:text-primary transition-colors truncate">
                                         {lesson.title}
                                       </span>
                                    </div>
                                    <div className="flex items-center gap-6 flex-shrink-0">
                                      {lesson.is_preview && !isEnrolled ? (
                                        <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-black uppercase tracking-widest px-3 py-1">Preview</Badge>
                                      ) : !isEnrolled ? (
                                        <Lock className="h-4 w-4 text-gray-300" />
                                      ) : null}
                                      <span className="text-xs font-black text-muted-foreground uppercase tracking-widest w-12 text-right">
                                        {lesson.duration_minutes ? `${lesson.duration_minutes}M` : ''}
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
                    <div className="p-20 text-center">
                      <p className="text-lg font-bold text-gray-400">Curriculum is coming soon.</p>
                    </div>
                 )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-8">
               <h2 className="text-3xl font-black tracking-tight">Description.</h2>
               <div className="prose prose-lg prose-gray max-w-none prose-headings:font-black prose-p:font-medium prose-p:leading-relaxed prose-a:text-primary prose-a:font-black prose-img:rounded-[3rem] prose-img:shadow-2xl">
                  <ReactMarkdown>{course.description || "No description provided."}</ReactMarkdown>
               </div>
            </div>
            
            {/* Instructor Details */}
            <div id="instructor" className="pt-20 border-t border-gray-100">
               <h2 className="text-3xl font-black tracking-tight mb-12">Meet your <span className="text-primary italic">mentor.</span></h2>
               <div className="bg-white/50 backdrop-blur-xl rounded-[3rem] border border-white/50 p-12 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row gap-12">
                 <div className="flex-shrink-0">
                    <div className="relative">
                      {course.instructor?.avatar_url ? (
                        <Image 
                          src={course.instructor.avatar_url} 
                          alt={course.instructor.full_name || 'Instructor'}
                          width={140}
                          height={140}
                          className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white shadow-2xl"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-[2.5rem] bg-primary/10 flex items-center justify-center border-4 border-white shadow-2xl">
                          <span className="text-4xl font-black text-primary">
                            {course.instructor?.full_name?.charAt(0) || 'I'}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-2xl shadow-lg">
                        <Award className="w-5 h-5" />
                      </div>
                    </div>
                 </div>
                 <div className="space-y-4 flex-1">
                    <div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                        {course.instructor?.full_name || "Expert Instructor"}
                      </h3>
                      <p className="text-sm font-black text-primary uppercase tracking-widest mt-1">Senior AI Specialist & Mentor</p>
                    </div>
                    {course.instructor?.bio_md && (
                      <div className="prose prose-gray max-w-none prose-p:font-medium prose-p:text-muted-foreground/90">
                         <ReactMarkdown>{course.instructor.bio_md}</ReactMarkdown>
                      </div>
                    )}
                 </div>
               </div>
            </div>

             {/* Reviews */}
             <div className="pt-20 border-t border-gray-100 pb-32">
                <h2 className="text-3xl font-black tracking-tight mb-12">Student Feedback.</h2>
                
                <div className="grid md:grid-cols-12 gap-12 mb-16">
                   <div className="md:col-span-4 flex flex-col items-center justify-center p-12 bg-white/50 backdrop-blur-xl rounded-[3rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-center">
                      <div className="text-7xl font-black text-gray-900 mb-4 tracking-tighter tabular-nums">
                        {course.stats.average_rating.toFixed(1)}
                      </div>
                      <div className="flex gap-1 mb-4">
                         {[1, 2, 3, 4, 5].map((star) => (
                           <Star 
                             key={star} 
                             className={`w-6 h-6 ${star <= Math.round(course.stats.average_rating) ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} 
                           />
                         ))}
                      </div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">COURSE RATING</p>
                   </div>
                   
                   <div className="md:col-span-8 flex flex-col justify-center">
                       <div className="space-y-4">
                           {[5, 4, 3, 2, 1].map((rating) => {
                             const count = ratingDistribution[rating as keyof typeof ratingDistribution] || 0;
                             const percentage = course.stats.total_reviews > 0 ? (count / course.stats.total_reviews) * 100 : 0;
                             return (
                               <div key={rating} className="flex items-center gap-6">
                                  <div className="flex items-center gap-1 min-w-[30px]">
                                     <span className="text-sm font-black text-gray-900">{rating}</span>
                                     <Star className="w-3.5 h-3.5 fill-current text-yellow-400" />
                                  </div>
                                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex-1">
                                     <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
                                  </div>
                                  <span className="text-xs font-black text-muted-foreground uppercase tracking-widest min-w-[40px] text-right">{percentage.toFixed(0)}%</span>
                               </div>
                             )
                           })}
                       </div>
                   </div>
                </div>

                {isEnrolled && user && (
                    <div className="mb-16">
                      <ReviewForm 
                        courseId={courseId} 
                        userId={user.id}
                        existingReview={userReview}
                      />
                    </div>
                )}
                
                <ReviewsList reviews={(reviews || []) as never[]} />
             </div>
          </div>
          
          {/* RIGHT COLUMN - Sticky Sidebar */}
          <div className="lg:col-span-4">
             <div className="sticky top-12 space-y-8">
                {/* Enrollment Card */}
                <Card className="overflow-hidden border-0 shadow-2xl shadow-black/10 bg-white rounded-[3rem] p-0 ring-1 ring-gray-100">
                   {course.thumbnail_url && !course.intro_video_url && (
                     <div className="relative aspect-video w-full overflow-hidden">
                        <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/10" />
                     </div>
                   )}
                   
                   <CardContent className="p-10">
                      <div className="flex items-center gap-4 mb-8">
                        <span className="text-5xl font-black text-gray-900 tracking-tight tabular-nums">
                           {formattedPrice}
                        </span>
                        {isInBundle && (
                          <span className="text-lg text-muted-foreground/60 line-through tabular-nums">
                            ${(course.price_cents * 1.3 / 100).toFixed(0)}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        {isEnrolled ? (
                          <Button 
                            asChild
                            size="xl"
                            className="w-full bg-black hover:bg-black/90 text-white rounded-[1.5rem] h-16 text-lg font-black tracking-tight shadow-xl shadow-black/20 group transition-all"
                          >
                            <Link href={`/learn/${courseId}/player`} className="flex items-center justify-center gap-2">
                              Resume Journey
                              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                          </Button>
                        ) : (
                          <Button 
                            asChild
                            size="xl"
                            className="w-full bg-primary hover:bg-primary/95 text-white rounded-[1.5rem] h-16 text-lg font-black tracking-tight shadow-xl shadow-primary/30 group transition-all border-0"
                          >
                            <Link href={`/checkout?courseId=${courseId}`} className="flex items-center justify-center gap-2">
                              Enroll Now
                              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                          </Button>
                        )}
                      </div>
                      
                      <div className="mt-12 pt-8 border-t border-gray-100">
                         <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">WHAT&apos;S INCLUDED</h4>
                         <ul className="space-y-5">
                            <li className="flex items-center gap-4 group">
                               <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                 <Video className="w-4 h-4 text-primary" />
                               </div>
                               <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">{formattedDuration} on-demand</span>
                            </li>
                            <li className="flex items-center gap-4 group">
                               <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                 <BookOpen className="w-4 h-4 text-primary" />
                               </div>
                               <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">{course.lessons_count} total modules</span>
                            </li>
                            <li className="flex items-center gap-4 group">
                               <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                 <Award className="w-4 h-4 text-primary" />
                               </div>
                               <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">Global certification</span>
                            </li>
                            <li className="flex items-center gap-4 group">
                               <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                 <Users className="w-4 h-4 text-primary" />
                               </div>
                               <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">Community access</span>
                            </li>
                         </ul>
                      </div>
                   </CardContent>
                   <div className="bg-gray-50/50 p-6 flex items-center justify-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                       <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">30-Day Happiness Guarantee</span>
                   </div>
                </Card>
                
                {/* Meta Details */}
                <div className="bg-white/50 backdrop-blur-xl rounded-[2.5rem] border border-white/50 p-8 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Experience</span>
                      <span className="text-sm font-black text-gray-900 uppercase tracking-widest">{course.level}</span>
                   </div>
                   <div className="flex justify-between items-center border-t border-gray-100/50 pt-4">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Language</span>
                      <span className="text-sm font-black text-gray-900 uppercase tracking-widest">{course.language}</span>
                   </div>
                    <div className="flex justify-between items-center border-t border-gray-100/50 pt-4">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtitles</span>
                      <span className="text-sm font-black text-gray-900 uppercase tracking-widest">EN, FR, DE</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
