import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { getStudentEnrolledCourses, getStudentCertificates, getStudentProgress } from "@/server/actions/student.actions";
import { getStudentEnrolledCourses as getEnrollmentsWithProgress } from "@/server/actions/enrollment.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Award, CheckCircle, Clock, ArrowRight, PlayCircle, BarChart } from "lucide-react";

export default async function StudentDashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== UserRole.STUDENT) {
    redirect("/sign-in");
  }
  
  const [coursesResult, certificatesResult, progressResult] = await Promise.all([
    getEnrollmentsWithProgress(user.id),
    getStudentCertificates(user.id),
    getStudentProgress(user.id)
  ]);
  
  const courses = coursesResult.success ? coursesResult.data : [];
  const certificates = certificatesResult.success ? certificatesResult.data : [];
  const progressData = progressResult.success ? progressResult.data : [];
  
  // Calculate stats
  const totalEnrolled = courses?.length || 0;
  const totalCertificates = certificates?.length || 0;
  const lessonsCompleted = progressData?.length || 0;
  
  // Get active course (most recent or first)
  const activeCourse = courses && courses.length > 0 ? courses[0] : null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-white selection:bg-primary selection:text-white pb-20">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

      {/* Hero Welcome Section */}
      <div className="relative pt-8 pb-4 lg:pt-12 lg:pb-6 border-b border-gray-100/50">
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex flex-col gap-2 w-full lg:w-auto">
               <div>
                 <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-[0.2em] mb-2">
                   Student Portal
                 </div>
                 <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight">
                   Welcome back, <br />
                   <span className="text-primary italic">{profile?.full_name?.split(' ')[0] || 'Scholar'}.</span>
                 </h1>
                 <p className="text-base text-muted-foreground/80 mt-4 font-medium max-w-md leading-relaxed">
                   You&apos;ve learned a lot this week. Continue your streak and master new skills.
                 </p>
               </div>
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
               <Button asChild size="lg" className="w-full lg:w-auto rounded-2xl bg-gray-900 hover:bg-primary text-white h-14 px-8 shadow-2xl shadow-black/10 transition-all font-black tracking-tight active:scale-95 border-0">
                 <Link href="/courses" className="flex items-center justify-center gap-2">
                    <BookOpen className="h-5 w-5" /> Explore Courses
                 </Link>
               </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8 pb-12 lg:pt-10 lg:pb-16 max-w-7xl relative z-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-blue-50/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden group hover:shadow-[0_32px_64px_-16px_rgba(59,130,246,0.1)] transition-all duration-500">
             <CardContent className="p-8 flex items-center gap-6">
                <div className="h-14 w-14 rounded-[1.25rem] bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-lg shadow-blue-500/10">
                   <BookOpen className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-[0.2em] mb-1">Enrolled</p>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{totalEnrolled}</h3>
                </div>
             </CardContent>
          </Card>
          
          <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-green-50/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden group hover:shadow-[0_32px_64px_-16px_rgba(34,197,94,0.1)] transition-all duration-500">
             <CardContent className="p-8 flex items-center gap-6">
                <div className="h-14 w-14 rounded-[1.25rem] bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-lg shadow-green-500/10">
                   <CheckCircle className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-green-600/60 uppercase tracking-[0.2em] mb-1">Completed</p>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{lessonsCompleted}</h3>
                </div>
             </CardContent>
          </Card>
          
          <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-purple-50/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden group hover:shadow-[0_32px_64px_-16px_rgba(168,85,247,0.1)] transition-all duration-500">
             <CardContent className="p-8 flex items-center gap-6">
                <div className="h-14 w-14 rounded-[1.25rem] bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-lg shadow-purple-500/10">
                   <Award className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-purple-600/60 uppercase tracking-[0.2em] mb-1">Certificates</p>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{totalCertificates}</h3>
                </div>
             </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* LEFT COLUMN: Course List */}
           <div className="lg:col-span-8 space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  <PlayCircle className="h-6 w-6 text-primary" />
                  Continue <span className="text-primary italic">Learning.</span>
                </h2>
                {courses && courses.length > 0 && (
                   <Link href="/courses" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors flex items-center gap-2 group">
                     Find more courses <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                   </Link>
                )}
              </div>
              
              {courses && courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {courses.map((enrollment) => {
                    // Extract course data safely
                    const courseData = (Array.isArray(enrollment.courses) && enrollment.courses.length > 0 
                      ? enrollment.courses[0] 
                      : enrollment.courses) as any;
                      
                    const progress = enrollment.progress || { progress_percent: 0, total_lessons: 0, completed_lessons: 0 };
                    
                    if (!courseData) return null;

                    return (
                      <Card key={enrollment.id} className="group border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white rounded-[3rem] overflow-hidden hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col h-full">
                         {/* Thumbnail Header */}
                         <div className="relative h-52 bg-gray-100 overflow-hidden">
                            {courseData.thumbnail_url ? (
                              <Image 
                                src={courseData.thumbnail_url} 
                                alt={courseData.title} 
                                fill 
                                className="object-cover transition-transform duration-700 group-hover:scale-110" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                <BookOpen className="h-16 w-16 text-gray-200" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6">
                               <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                                 {courseData.category || 'General'}
                               </span>
                            </div>
                         </div>
                         
                         <CardContent className="p-8 flex flex-col flex-1">
                            <h3 className="text-xl font-black text-gray-900 mb-3 leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                              {courseData.title}
                            </h3>
                            <p className="text-sm text-muted-foreground/80 font-medium line-clamp-2 mb-8 leading-relaxed flex-1">
                              {courseData.subtitle || courseData.description || 'No description available'}
                            </p>
                            
                            <div className="space-y-4 pt-6 border-t border-gray-50 mt-auto">
                               <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                                  <span className="text-gray-400">{progress.completed_lessons}/{progress.total_lessons} Lessons</span>
                                  <span className="text-primary">{Math.round(progress.progress_percent)}% Complete</span>
                               </div>
                               <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${Math.max(5, progress.progress_percent)}%` }}
                                  />
                               </div>
                               
                               <Button asChild className="w-full rounded-2xl bg-gray-900 text-white hover:bg-primary h-12 shadow-xl shadow-black/5 hover:shadow-primary/20 transition-all active:scale-95 font-black uppercase tracking-wide text-xs">
                                  <Link href={`/learn/${courseData.id}/player`}>
                                    {progress.progress_percent > 0 ? 'Continue Journey' : 'Start Learning'} <ArrowRight className="ml-2 w-4 h-4" />
                                  </Link>
                               </Button>
                            </div>
                         </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                 <div className="text-center py-24 bg-white/50 backdrop-blur-xl rounded-[3rem] border-4 border-dashed border-gray-100 relative overflow-hidden">
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl opacity-50" />
                    <div className="relative z-10">
                       <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                          <BookOpen className="h-8 w-8 text-gray-300" />
                       </div>
                       <h3 className="text-2xl font-black text-gray-900 mb-2">No active courses</h3>
                       <p className="text-muted-foreground font-medium mb-8 max-w-sm mx-auto">
                         You haven&apos;t enrolled in any courses yet. Browse our catalog to find your next breakthrough.
                       </p>
                       <Button asChild size="lg" className="rounded-2xl h-14 px-8 bg-gray-900 text-white hover:bg-primary font-black shadow-xl shadow-black/10">
                         <Link href="/courses">Browse Catalog</Link>
                       </Button>
                    </div>
                 </div>
              )}
           </div>
           
           {/* RIGHT COLUMN: Sidebar */}
           <div className="lg:col-span-4 space-y-10">
              {/* Recent Activity */}
               <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                     <div className="inline-block px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[9px] font-black uppercase tracking-[0.2em] mb-4 w-fit">
                        Timeline
                     </div>
                     <CardTitle className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Clock className="h-5 w-5 text-gray-400" /> Recent Activity
                     </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-8 pt-2">
                     {progressData && progressData.length > 0 ? (
                       <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 py-2">
                         {progressData.slice(0, 5).map((item, idx) => {
                            const lesson = Array.isArray(item.lessons) ? item.lessons[0] : item.lessons;
                            const course = lesson?.courses ? (Array.isArray(lesson.courses) ? lesson.courses[0] : lesson.courses) : null;
                            
                            return (
                              <div key={`${item.user_id}-${item.lesson_id}-${idx}`} className="relative pl-8 group">
                                 <div className="absolute -left-[5px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-gray-200 group-hover:border-primary group-hover:scale-125 transition-all duration-300" />
                                 
                                 <div className="group-hover:translate-x-1 transition-transform duration-300">
                                    <p className="text-sm font-bold text-gray-900 line-clamp-1">{lesson?.title || 'Unknown Lesson'}</p>
                                    <p className="text-xs text-muted-foreground font-medium line-clamp-1 mb-1">{course?.title || 'Unknown Course'}</p>
                                    <span className="inline-block px-2 py-0.5 rounded-md bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                      {item.completed_at ? new Date(item.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Just now'}
                                    </span>
                                 </div>
                              </div>
                            );
                         })}
                       </div>
                     ) : (
                       <div className="text-center py-8">
                          <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">No recent activity</p>
                       </div>
                     )}
                  </CardContent>
               </Card>

               {/* Quick Nav Card */}
               <div className="bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl shadow-gray-900/20 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                  
                  <div className="relative z-10">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-4">Settings</p>
                     <h3 className="text-2xl font-black mb-2 tracking-tight">Your Profile</h3>
                     <p className="text-white/70 text-sm font-medium mb-8 leading-relaxed">Update your personal information and account preferences.</p>
                     <Button asChild className="w-full bg-white text-gray-900 hover:bg-primary hover:text-white border-0 font-black rounded-xl h-12 transition-all">
                        <Link href="/profile">Manage Profile</Link>
                     </Button>
                  </div>
               </div>
               
               {/* Certificates List */}
               <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                     <div className="inline-block px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 text-[9px] font-black uppercase tracking-[0.2em] mb-4 w-fit">
                        Achievements
                     </div>
                     <CardTitle className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Award className="h-5 w-5 text-gray-400" /> Certificates
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-2">
                     {certificates && certificates.length > 0 ? (
                       <div className="space-y-4">
                          {certificates.slice(0, 3).map(cert => {
                            const course = Array.isArray(cert.courses) ? cert.courses[0] : cert.courses;
                            return (
                              <div key={cert.id} className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 hover:bg-white hover:shadow-lg hover:shadow-black/5 transition-all duration-300 cursor-default group">
                                 <div className="h-10 w-10 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <Award className="h-5 w-5" />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-xs font-black text-gray-900 truncate">{course?.title || 'Unknown Course'}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Verified</p>
                                 </div>
                              </div>
                            );
                          })}
                          <Button variant="ghost" asChild className="w-full mt-2 font-black text-xs uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl h-10">
                              <Link href="/profile?tab=certificates">View All</Link>
                           </Button>
                       </div>
                     ) : (
                        <div className="text-center py-8">
                           <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-50">
                              <Award className="h-8 w-8 text-gray-300" />
                           </div>
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4">Complete courses to earn certificates</p>
                        </div>
                     )}
                  </CardContent>
               </Card>
           </div>
        </div>
      </div>
    </div>
  );
}