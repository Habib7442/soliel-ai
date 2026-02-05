import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { getInstructorCourses, getCourseEarnings, getStudentEnrollments, getInstructorAnalytics } from "@/server/actions/instructor.actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DeleteCourseButton } from "@/components/instructor/DeleteCourseButton";
import { BookOpen, Users, DollarSign, Plus, BarChart, Settings, Clock, ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export default async function InstructorDashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== UserRole.INSTRUCTOR && profile?.role !== UserRole.SUPER_ADMIN) {
    redirect("/sign-in");
  }
  
  const [coursesResult, earningsResult, enrollmentsResult, analyticsResult] = await Promise.all([
    getInstructorCourses(user.id),
    getCourseEarnings(user.id),
    getStudentEnrollments(user.id),
    getInstructorAnalytics(user.id)
  ]);
  
  const courses = coursesResult.success ? coursesResult.data : [];
  const earnings = earningsResult.success ? earningsResult.data : [];
  const enrollments = enrollmentsResult.success ? enrollmentsResult.data : [];
  const analytics = analyticsResult.success ? analyticsResult.data : { totalStudents: 0, totalRevenue: 0, averageRating: 0 };
  
  const totalRevenue = analytics?.totalRevenue || 0;
  const totalStudents = analytics?.totalStudents || 0;

  return (
    <div className="min-h-screen relative overflow-hidden bg-white selection:bg-primary selection:text-white">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] -z-10" />

      {/* Hero Welcome Section */}
      <div className="relative pt-8 pb-4 lg:pt-12 lg:pb-6 border-b border-gray-100/50">
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="flex flex-col gap-2">
               <div>
                 <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-[0.2em] mb-2">
                   Creator Portal
                 </div>
                 <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-tight">
                   Welcome back, <br />
                   <span className="text-primary italic">{profile?.full_name?.split(' ')[0] || 'Maestro'}.</span>
                 </h1>
                 <p className="text-base text-muted-foreground/80 mt-2 font-medium max-w-md">
                   You have <span className="text-gray-900 font-bold">{courses?.length || 0} active</span> courses.
                 </p>
               </div>
            </div>

            
            <div className="flex flex-wrap items-center gap-3">
               <Button asChild variant="outline" size="lg" className="rounded-2xl border-gray-200 h-14 px-5 hover:border-primary hover:text-primary transition-all font-black tracking-tight active:scale-95 bg-white/50 backdrop-blur-sm">
                 <Link href="/instructor/activity" className="flex items-center gap-2">
                    <div className="relative">
                       <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 border border-white animate-pulse" />
                       <BookOpen className="h-4 w-4" /> 
                    </div>
                    Activity
                 </Link>
               </Button>
               <Button asChild variant="outline" size="lg" className="rounded-2xl border-gray-200 h-14 px-5 hover:border-primary hover:text-primary transition-all font-black tracking-tight active:scale-95 bg-white/50 backdrop-blur-sm">
                 <Link href="/instructor/reviews" className="flex items-center gap-2">
                    <Star className="h-4 w-4" /> Reviews
                 </Link>
               </Button>
               <Button asChild variant="outline" size="lg" className="rounded-2xl border-gray-200 h-14 px-5 hover:border-primary hover:text-primary transition-all font-black tracking-tight active:scale-95 bg-white/50 backdrop-blur-sm">
                 <Link href="/instructor/bundles" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Bundles
                 </Link>
               </Button>
               <Button asChild variant="outline" size="lg" className="rounded-2xl border-gray-200 h-14 px-5 hover:border-primary hover:text-primary transition-all font-black tracking-tight active:scale-95 bg-white/50 backdrop-blur-sm">
                 <Link href="/earnings" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Earnings
                 </Link>
               </Button>
               <Button asChild size="lg" className="rounded-2xl bg-gray-900 hover:bg-primary text-white h-14 px-6 shadow-2xl shadow-black/10 transition-all font-black tracking-tight active:scale-95 border-0">
                 <Link href="/instructor/courses/create" className="flex items-center gap-2">
                    <Plus className="h-5 w-5" /> New Course
                 </Link>
               </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8 pb-12 lg:pt-10 lg:pb-16 max-w-7xl relative z-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-blue-50/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden group hover:shadow-[0_32px_64px_-16px_rgba(59,130,246,0.1)] transition-all duration-500">
               <CardContent className="p-8 flex items-center gap-6">
                  <div className="h-14 w-14 rounded-[1.25rem] bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-lg shadow-blue-500/10">
                     <BookOpen className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-[0.2em] mb-1">Live Courses</p>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{courses?.length || 0}</h3>
                  </div>
               </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-green-50/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden group hover:shadow-[0_32px_64px_-16px_rgba(34,197,94,0.1)] transition-all duration-500">
               <CardContent className="p-8 flex items-center gap-6">
                  <div className="h-14 w-14 rounded-[1.25rem] bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-lg shadow-green-500/10">
                     <Users className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-green-600/60 uppercase tracking-[0.2em] mb-1">Total Students</p>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{totalStudents}</h3>
                  </div>
               </CardContent>
            </Card>
          </div>
          
          <Link href="/earnings" className="block">
            <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-purple-50/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden group hover:shadow-[0_32px_64px_-16px_rgba(168,85,247,0.1)] transition-all duration-500 border-2 border-transparent hover:border-purple-200 cursor-pointer">
               <CardContent className="p-8 flex items-center gap-6">
                  <div className="h-14 w-14 rounded-[1.25rem] bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-lg shadow-purple-500/10">
                     <DollarSign className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black text-purple-600/60 uppercase tracking-[0.2em] mb-1">Total Earnings</p>
                      <ArrowRight className="h-3 w-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">${totalRevenue.toFixed(0)}</h3>
                  </div>
               </CardContent>
            </Card>
          </Link>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

           {/* Left Column: Courses */}
           <div className="lg:col-span-2 space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  Product <span className="text-primary italic">Catalogue.</span>
                </h2>
              </div>
              
              {courses && courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {courses.map((course) => (
                    <Card key={course.id} className="overflow-hidden border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white rounded-[3rem] hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 group flex flex-col">
                      <div className="relative h-56 bg-gray-100 overflow-hidden">
                        {course.thumbnail_url ? (
                          <Image
                            src={course.thumbnail_url}
                            alt={course.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50">
                             <BookOpen className="h-16 w-16 text-primary/10" />
                          </div>
                        )}
                        <div className="absolute top-6 right-6">
                           <Badge variant={course.is_published ? "default" : "secondary"} className={`rounded-xl px-4 py-1.5 font-black text-[10px] uppercase tracking-widest ${course.is_published ? "bg-green-500 text-white border-0" : "bg-white/90 backdrop-blur-sm text-gray-900 border-0"}`}>
                             {course.is_published ? 'Published' : 'Draft'}
                           </Badge>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                      
                      <CardContent className="p-8 flex flex-grow flex-col">
                         <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">
                            <span className="text-primary font-black">${(course.price_cents / 100).toFixed(0)}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-200" />
                            <span>{course.level}</span>
                         </div>
                         
                         <h3 className="text-xl font-black text-gray-900 mb-3 group-hover:text-primary transition-colors leading-tight line-clamp-2">{course.title}</h3>
                         <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-8 font-medium leading-relaxed flex-grow">
                           {course.subtitle || "Refine and publish your knowledge to the world."}
                         </p>
                         
                         <div className="flex gap-3 pt-6 border-t border-gray-50">
                            <Button asChild size="lg" className="flex-[2] rounded-2xl bg-gray-900 hover:bg-primary text-white font-black tracking-tight transition-all active:scale-95 border-0 h-14">
                               <Link href={`/instructor/courses/${course.id}`}>Manage Hub</Link>
                            </Button>
                            <DeleteCourseButton courseId={course.id} />
                         </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Add New Card (Ghost) */}
                  <Link href="/instructor/courses/create" className="group flex flex-col items-center justify-center min-h-[400px] border-4 border-dashed border-gray-100 rounded-[3rem] hover:border-primary/30 hover:bg-primary/5 transition-all p-12 text-center">
                     <div className="h-20 w-20 rounded-[1.5rem] bg-gray-50 group-hover:bg-white flex items-center justify-center mb-8 transition-all duration-500 shadow-inner group-hover:shadow-2xl group-hover:shadow-primary/10 group-hover:-translate-y-2">
                        <Plus className="h-10 w-10 text-gray-300 group-hover:text-primary transition-colors" />
                     </div>
                     <h3 className="text-2xl font-black text-gray-900 group-hover:text-primary transition-colors tracking-tight">Launch New <span className="italic">Masterpiece.</span></h3>
                     <p className="text-base text-muted-foreground/70 mt-3 font-medium max-w-[240px] leading-relaxed">Turn your specialized knowledge into a premium learning experience.</p>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-24 bg-white/50 backdrop-blur-xl rounded-[3rem] border-4 border-dashed border-gray-100 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl opacity-50" />
                  <div className="relative z-10">
                    <div className="w-24 h-24 bg-gray-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <BookOpen className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-3xl font-black mb-4 tracking-tight">No courses found</h3>
                    <p className="text-lg text-muted-foreground/70 mb-10 max-w-sm mx-auto font-medium">Ready to share your expertise? Create your first course today.</p>
                    <Button asChild size="xl" className="rounded-2xl h-16 px-12 bg-gray-900 text-white font-black text-lg shadow-xl shadow-black/10 hover:bg-primary transition-all active:scale-95">
                      <Link href="/instructor/courses/create">Start Teaching</Link>
                    </Button>
                  </div>
                </div>
              )}
           </div>
           
           {/* Right Column: Activity */}
           <div className="space-y-12">
              {/* Recent Enrollments */}
              <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                 <CardHeader className="p-8 pb-4">
                    <div className="inline-block px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[9px] font-black uppercase tracking-[0.2em] mb-4 w-fit">
                      Live Stream
                    </div>
                    <CardTitle className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                       <Clock className="h-5 w-5 text-gray-400" /> Recent Enrollments
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-4 pt-0">
                    {enrollments && enrollments.length > 0 ? (
                       <div className="space-y-2">
                          {enrollments.slice(0, 5).map((enrollment, idx) => {
                             const courseData = enrollment.courses as any;
                             const course = Array.isArray(courseData) ? courseData[0] : courseData;
                             const courseTitle = course?.title || 'Unknown Course';
                             
                             return (
                               <div key={enrollment.id} className="p-5 rounded-[1.5rem] hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all duration-300 group cursor-default">
                                  <div className="flex justify-between items-start mb-2">
                                     <p className="font-black text-sm text-gray-900">Student {idx + 1}</p>
                                     <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                                        {new Date(enrollment.created_at).toLocaleDateString()}
                                     </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                     Secured access to <span className="text-primary font-black group-hover:underline italic">{courseTitle}</span>
                                  </p>
                               </div>
                             );
                          })}
                       </div>
                    ) : (
                       <div className="p-10 text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                          Awaiting Pioneers.
                       </div>
                    )}
                    <div className="p-4 mt-2">
                      <Button variant="ghost" className="w-full rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors group">
                        View All Activity
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                 </CardContent>
              </Card>

              {/* Earnings Table */}
              <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                    <div className="inline-block px-3 py-1 rounded-full bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-[0.2em] mb-4 w-fit">
                      Revenue Pulse
                    </div>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                         <BarChart className="h-5 w-5 text-gray-400" /> Recent Earnings
                      </CardTitle>
                      <Link href="/earnings" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                        Details
                      </Link>
                    </div>
                  </CardHeader>
                 <CardContent className="p-4 pt-0">
                    {earnings && earnings.length > 0 ? (
                       <div className="space-y-2">
                          {earnings.slice(0, 5).map((earning) => {
                             const courseData = earning.courses as any;
                             const course = Array.isArray(courseData) ? courseData[0] : courseData;
                             const courseTitle = course?.title || 'Unknown Course';
                             
                             return (
                               <div key={earning.id} className="p-5 rounded-[1.5rem] flex items-center justify-between hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all duration-300 group cursor-default">
                                  <div className="min-w-0 flex-1 mr-4">
                                     <p className="font-black text-sm text-gray-900 truncate">{courseTitle}</p>
                                     <p className="text-[10px] font-bold text-gray-400">
                                        {new Date(earning.created_at).toLocaleDateString()}
                                     </p>
                                  </div>
                                  <span className="font-black text-green-600 text-lg tabular-nums">
                                     +${earning.amount?.toFixed(0)}
                                  </span>
                               </div>
                             );
                          })}
                       </div>
                    ) : (
                       <div className="p-10 text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                          Market is Opening.
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