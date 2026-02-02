import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { CourseFaqDisplay } from "@/components/course/CourseFaqDisplay";
import { ChevronLeft, Star, Users, Clock, BookOpen, Play } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen relative overflow-hidden bg-white selection:bg-primary selection:text-white pb-20">
      {/* Background Blobs */}
      <div className="fixed top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Header / Back */}
      <div className="container mx-auto px-4 pt-8 max-w-7xl relative z-10">
         <Button asChild variant="ghost" size="sm" className="mb-6 hover:bg-gray-100 rounded-xl">
            <Link href="/student-dashboard" className="flex items-center text-muted-foreground hover:text-primary">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
      </div>

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Header Card */}
            <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden p-8 md:p-10">
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-4">
                     <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="secondary" className="capitalize px-3 py-1 bg-gray-100 text-gray-900 border-0 font-bold uppercase tracking-wider text-xs">
                          {course.level}
                        </Badge>
                        <div className="flex items-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                            {averageRating.toFixed(1)} <span className="mx-1">•</span> {totalReviews} reviews
                        </div>
                     </div>
                     <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight">
                        {course.title}
                     </h1>
                     <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl">
                        {course.subtitle}
                     </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 mt-2">
                     {course.thumbnail_url && (
                        <div className="sm:w-1/3 min-w-[200px] aspect-video rounded-2xl overflow-hidden shadow-lg shadow-black/5 ring-1 ring-black/5">
                           <img 
                              src={course.thumbnail_url} 
                              alt={course.title}
                              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                           />
                        </div>
                     )}
                     <div className="flex flex-col justify-center gap-4 flex-1">
                        <div className="flex items-center gap-3">
                           {course.profiles?.avatar_url ? (
                              <img 
                                 src={course.profiles.avatar_url} 
                                 alt={course.profiles.full_name || 'Instructor'}
                                 className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-sm"
                              />
                           ) : (
                              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-500 text-lg">
                                 {course.profiles?.full_name?.charAt(0) || 'I'}
                              </div>
                           )}
                           <div>
                              <p className="font-bold text-gray-900 text-base">{course.profiles?.full_name || 'Unknown'}</p>
                              <p className="text-xs font-bold uppercase tracking-wider text-primary">Instructor</p>
                           </div>
                        </div>

                        {enrollment ? (
                           <Button asChild size="lg" className="w-full sm:w-auto rounded-2xl bg-primary hover:bg-primary/90 text-white font-black h-14 px-8 text-base shadow-lg shadow-primary/20">
                              <Link href={`/learn/${courseId}/player`}>
                                 <Play className="mr-2 h-5 w-5 fill-current" /> Continue Learning
                              </Link>
                           </Button>
                        ) : (
                           <Button asChild size="lg" className="w-full sm:w-auto rounded-2xl bg-gray-900 hover:bg-black text-white font-black h-14 px-8 text-base shadow-xl shadow-black/10">
                              <Link href={`/courses/${courseId}/enroll`}>Enroll Now</Link>
                           </Button>
                        )}
                     </div>
                  </div>
                </div>
            </div>
            
            {/* Course Description */}
            <div className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <h2 className="text-2xl font-black mb-6 tracking-tight">Description</h2>
                <div className="prose prose-gray prose-lg max-w-none text-gray-600 font-medium leading-relaxed">
                   <ReactMarkdown>{course.description || ""}</ReactMarkdown>
                </div>
            </div>
            
            {/* Course Content Accordion */}
            <div className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-2xl font-black tracking-tight">Curriculum</h2>
                   <div className="bg-gray-100 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {sections?.length || 0} Sections • {totalLessons} Lessons
                   </div>
                </div>

                <div className="space-y-4">
                  {sections && sections.length > 0 ? (
                    sections.map((section, index) => (
                      <div key={section.id} className="border border-gray-100 bg-white/50 rounded-2xl p-6 transition-all hover:shadow-md hover:border-primary/20 hover:bg-primary/5">
                        <div className="flex items-start justify-between gap-4">
                           <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Section {index + 1}</div>
                              <h3 className="font-bold text-lg text-gray-900 mb-2">{section.title}</h3>
                              {section.description && (
                                <p className="text-sm text-gray-500 font-medium leading-relaxed mb-3">{section.description}</p>
                              )}
                           </div>
                           <div className="flex items-center text-xs font-bold text-gray-400 bg-white px-3 py-1 rounded-lg border border-gray-100 flex-shrink-0">
                               <BookOpen className="h-3 w-3 mr-2" />
                               {(section.lessons as LessonCount)?.count || 0} lessons
                           </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground font-medium">No content avaliable yet.</div>
                  )}
                </div>
            </div>
            
            {/* Course FAQ */}
            <div className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
               <CourseFaqDisplay courseId={courseId} />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Info */}
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sticky top-8">
               <h3 className="font-black text-xl mb-6 tracking-tight">Course Info</h3>
               <div className="space-y-5">
                 <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                   <span className="text-muted-foreground text-sm font-bold uppercase tracking-wider">Level</span>
                   <span className="font-bold capitalize bg-gray-100 px-3 py-1 rounded-lg text-xs">{course.level}</span>
                 </div>
                 <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                   <span className="text-muted-foreground text-sm font-bold uppercase tracking-wider">Language</span>
                   <span className="font-bold text-sm">{course.language}</span>
                 </div>
                 <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                   <span className="text-muted-foreground text-sm font-bold uppercase tracking-wider">Duration</span>
                   <span className="font-bold text-sm flex items-center gap-1">
                     <Clock className="w-3 h-3 text-primary" />
                     {course.estimated_duration_hours 
                       ? `${course.estimated_duration_hours} hours` 
                       : 'Self-paced'}
                   </span>
                 </div>
                 <div className="flex items-center justify-between pt-1">
                   <span className="text-muted-foreground text-sm font-bold uppercase tracking-wider">Price</span>
                   <span className="font-black text-2xl text-primary">
                     {course.price_cents > 0 
                       ? `$${(course.price_cents / 100).toFixed(2)}` 
                       : 'Free'}
                   </span>
                 </div>
               </div>
               
               <div className="mt-8 pt-8 border-t border-gray-100">
                   <div className="flex items-center gap-4 mb-4">
                      {course.profiles?.avatar_url && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-gray-100">
                           <img src={course.profiles.avatar_url} alt="Instructor" className="w-full h-full object-cover" /> 
                        </div>
                      )}
                      <div>
                         <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Taught by</p>
                         <p className="font-black text-gray-900 text-lg">{course.profiles?.full_name}</p>
                      </div>
                   </div>
               </div>
            </div>
            
            {/* Cert Preview Card (Optional encouragement) */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-[2rem] text-white shadow-xl shadow-black/20 text-center">
               <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                  <Star className="h-8 w-8 text-yellow-400 fill-current" />
               </div>
               <h3 className="font-black text-xl mb-2">Earn a Certificate</h3>
               <p className="text-gray-300 text-sm font-medium mb-6">Complete all lessons and assignments to receive a verified certificate of completion.</p>
               <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 w-1/3 opacity-30" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}