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
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      {/* Hero Welcome Section */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-7xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                  {profile?.avatar_url ? (
                    <Image 
                      src={profile.avatar_url} 
                      alt={profile.full_name || 'User'} 
                      width={64} 
                      height={64} 
                      className="object-cover h-full w-full"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
               </div>
               <div>
                 <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                   Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}!
                 </h1>
                 <p className="text-muted-foreground mt-1">
                   You&apos;ve learned a lot this week. Keep it up!
                 </p>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <Button asChild className="rounded-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                 <Link href="/courses">Explore Courses</Link>
               </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-shadow">
             <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <BookOpen className="h-6 w-6" />
             </div>
             <div>
               <p className="text-sm text-muted-foreground font-medium">Enrolled Courses</p>
               <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalEnrolled}</h3>
             </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-shadow">
             <div className="h-12 w-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                <CheckCircle className="h-6 w-6" />
             </div>
             <div>
               <p className="text-sm text-muted-foreground font-medium">Lessons Completed</p>
               <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{lessonsCompleted}</h3>
             </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-shadow">
             <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Award className="h-6 w-6" />
             </div>
             <div>
               <p className="text-sm text-muted-foreground font-medium">Certificates Earned</p>
               <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalCertificates}</h3>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* LEFT COLUMN: Course List */}
           <div className="lg:col-span-8 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  Continue Learning
                </h2>
                {courses && courses.length > 0 && (
                   <Link href="/courses" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                     Find more courses <ArrowRight className="h-4 w-4" />
                   </Link>
                )}
              </div>
              
              {courses && courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courses.map((enrollment) => {
                    // Extract course data safely
                    const courseData = (Array.isArray(enrollment.courses) && enrollment.courses.length > 0 
                      ? enrollment.courses[0] 
                      : enrollment.courses) as any;
                      
                    const progress = enrollment.progress || { progress_percent: 0, total_lessons: 0, completed_lessons: 0 };
                    
                    if (!courseData) return null;

                    return (
                      <div key={enrollment.id} className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 flex flex-col h-full">
                         {/* Thumbnail Header */}
                         <div className="relative h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                            {courseData.thumbnail_url ? (
                              <Image 
                                src={courseData.thumbnail_url} 
                                alt={courseData.title} 
                                fill 
                                className="object-cover transition-transform duration-500 group-hover:scale-105" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                                <BookOpen className="h-12 w-12 text-gray-400 opacity-50" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                            <div className="absolute bottom-4 left-4 right-4">
                               <p className="text-xs font-semibold text-white/90 bg-black/30 backdrop-blur-sm border border-white/10 rounded-full px-2 py-1 inline-block mb-2">
                                 {courseData.category || 'General'}
                               </p>
                            </div>
                         </div>
                         
                         <div className="p-6 flex flex-col flex-1">
                            <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                              {courseData.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                              {courseData.subtitle || courseData.description || 'No description available'}
                            </p>
                            
                            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700/50 mt-auto">
                               <div className="flex items-center justify-between text-xs font-medium">
                                  <span className="text-muted-foreground">{progress.completed_lessons}/{progress.total_lessons} Lessons</span>
                                  <span className="text-primary">{Math.round(progress.progress_percent)}% Complete</span>
                               </div>
                               <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.max(2, progress.progress_percent)}%` }}
                                  />
                               </div>
                               
                               <Button asChild className="w-full rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-primary hover:text-white dark:hover:bg-gray-200 shadow-none mt-2 transition-colors">
                                  <Link href={`/learn/${courseData.id}/player`}>
                                    {progress.progress_percent > 0 ? 'Continue' : 'Start Learning'}
                                  </Link>
                               </Button>
                            </div>
                         </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                 <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                       <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      You haven&apos;t enrolled in any courses yet. Browse our catalog to find something new to learn!
                    </p>
                    <Button asChild>
                      <Link href="/courses">Browse Catalog</Link>
                    </Button>
                 </div>
              )}
           </div>
           
           {/* RIGHT COLUMN: Sidebar */}
           <div className="lg:col-span-4 space-y-8">
              {/* Recent Activity */}
               <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-400" />
                    Recent Activity
                  </h3>
                  
                  {progressData && progressData.length > 0 ? (
                    <div className="space-y-4">
                      {progressData.slice(0, 5).map((item, idx) => {
                         const lesson = Array.isArray(item.lessons) ? item.lessons[0] : item.lessons;
                         const course = lesson?.courses ? (Array.isArray(lesson.courses) ? lesson.courses[0] : lesson.courses) : null;
                         
                         return (
                           <div key={`${item.user_id}-${item.lesson_id}-${idx}`} className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                              <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0 shadow-[0_0_0_4px_rgba(34,197,94,0.1)]" />
                              <div>
                                <p className="text-sm font-medium line-clamp-1">{lesson?.title || 'Unknown Lesson'}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{course?.title || 'Unknown Course'}</p>
                                <p className="text-[10px] text-gray-400">
                                  {item.completed_at ? new Date(item.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Just now'}
                                </p>
                              </div>
                           </div>
                         );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity recorded.</p>
                  )}
               </div>

               {/* Quick Nav Card */}
               <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6 shadow-lg">
                  <h3 className="font-bold text-lg mb-2">My Profile</h3>
                  <p className="text-gray-300 text-sm mb-6">Update your personal information and account settings.</p>
                  <Button asChild variant="outline" className="w-full border-gray-600 hover:bg-white hover:text-black hover:border-white text-black bg-white transition-colors">
                     <Link href="/profile">Manage Profile</Link>
                  </Button>
               </div>
               
               {/* Certificates Promo (if none) or List */}
               <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-gray-400" />
                    Your Certificates
                  </h3>
                  {certificates && certificates.length > 0 ? (
                    <div className="space-y-3">
                       {certificates.slice(0, 3).map(cert => {
                         const course = Array.isArray(cert.courses) ? cert.courses[0] : cert.courses;
                         return (
                           <div key={cert.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center gap-3">
                              <Award className="h-5 w-5 text-yellow-500 shrink-0" />
                              <span className="text-sm font-medium truncate flex-1">{course?.title || 'Course Certificate'}</span>
                           </div>
                         );
                       })}
                       <Button variant="link" asChild className="text-primary px-0 text-sm h-auto font-semibold">
                           <Link href="/profile?tab=certificates">View All Certificates</Link>
                        </Button>
                    </div>
                  ) : (
                     <div className="text-center py-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 opacity-50">
                           <Award className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">Complete courses to earn certificates!</p>
                     </div>
                  )}
               </div>
           </div>
        </div>
      </div>
    </div>
  );
}