import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { getInstructorCourses, getCourseEarnings, getStudentEnrollments } from "@/server/actions/instructor.actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DeleteCourseButton } from "@/components/instructor/DeleteCourseButton";
import { BookOpen, Users, DollarSign, Plus, BarChart, Settings, Clock, ArrowRight } from "lucide-react";
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
  
  const [coursesResult, earningsResult, enrollmentsResult] = await Promise.all([
    getInstructorCourses(user.id),
    getCourseEarnings(user.id),
    getStudentEnrollments(user.id)
  ]);
  
  const courses = coursesResult.success ? coursesResult.data : [];
  const earnings = earningsResult.success ? earningsResult.data : [];
  const enrollments = enrollmentsResult.success ? enrollmentsResult.data : [];
  
  const totalRevenue = earnings?.reduce((acc, earning) => acc + (earning.amount || 0), 0) || 0;
  const totalStudents = enrollments?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
      {/* Hero Welcome Section */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-7xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                  {profile?.avatar_url ? (
                    <Image 
                      src={profile.avatar_url} 
                      alt={profile.full_name || 'Instructor'} 
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
                   Instructor Dashboard
                 </h1>
                 <p className="text-muted-foreground mt-1">
                   Manage your courses and track your performance
                 </p>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <Button asChild variant="outline" className="gap-2">
                 <Link href="/admin-bundles">
                    <Settings className="h-4 w-4" /> Manage Bundles
                 </Link>
               </Button>
               <Button asChild className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                 <Link href="/instructor/courses/create">
                    <Plus className="h-4 w-4" /> Create Course
                 </Link>
               </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="border-none shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200">
             <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                   <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Courses</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{courses?.length || 0}</h3>
                </div>
             </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200">
             <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                   <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Students</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalStudents}</h3>
                </div>
             </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200">
             <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                   <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">${totalRevenue.toFixed(2)}</h3>
                </div>
             </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left Column: Courses */}
           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Your Courses
                </h2>
              </div>
              
              {courses && courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courses.map((course) => (
                    <Card key={course.id} className="overflow-hidden border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all duration-300 group">
                      <div className="relative h-40 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        {course.thumbnail_url ? (
                          <Image
                            src={course.thumbnail_url}
                            alt={course.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                             <BookOpen className="h-10 w-10 text-gray-300" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                           <Badge variant={course.is_published ? "default" : "secondary"} className={course.is_published ? "bg-green-500 hover:bg-green-600" : "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-200"}>
                             {course.is_published ? 'Published' : 'Draft'}
                           </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-5">
                         <h3 className="font-bold text-lg mb-1 line-clamp-1">{course.title}</h3>
                         <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                           {course.subtitle || "No description provided."}
                         </p>
                         
                         <div className="flex items-center justify-between text-sm mb-4">
                            <span className="font-bold text-primary">${(course.price_cents / 100).toFixed(2)}</span>
                            <span className="text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs capitalize">
                               {course.level}
                            </span>
                         </div>
                         
                         <div className="flex gap-2">
                            <Button asChild size="sm" variant="outline" className="flex-1">
                               <Link href={`/instructor/courses/${course.id}`}>Manage</Link>
                            </Button>
                            <DeleteCourseButton courseId={course.id} />
                         </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Add New Card (Ghost) */}
                  <Link href="/instructor/courses/create" className="group flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all p-6 text-center">
                     <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
                        <Plus className="h-6 w-6 text-gray-400 group-hover:text-primary transition-colors" />
                     </div>
                     <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Create New Course</h3>
                     <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">Start building your next masterpiece</p>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No courses created yet</h3>
                  <Button asChild className="mt-4">
                    <Link href="/instructor/courses/create">Create Your First Course</Link>
                  </Button>
                </div>
              )}
           </div>
           
           {/* Right Column: Activity */}
           <div className="space-y-8">
              {/* Recent Enrollments */}
              <Card className="border-none shadow-sm bg-white dark:bg-gray-800">
                 <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                       <Clock className="h-4 w-4 text-muted-foreground" /> Recent Enrollments
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                    {enrollments && enrollments.length > 0 ? (
                       <div className="divide-y divide-gray-100 dark:divide-gray-700">
                          {enrollments.slice(0, 5).map((enrollment, idx) => {
                             const courseData = enrollment.courses as any;
                             const course = Array.isArray(courseData) ? courseData[0] : courseData;
                             const courseTitle = course?.title || 'Unknown Course';
                             
                             return (
                               <div key={enrollment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                  <div className="flex justify-between items-start mb-1">
                                     <p className="font-medium text-sm">Student {idx + 1}</p>
                                     <span className="text-[10px] text-muted-foreground text-right block">
                                        {new Date(enrollment.created_at).toLocaleDateString()}
                                     </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                     Enrolled in <span className="text-primary font-medium">{courseTitle}</span>
                                  </p>
                               </div>
                             );
                          })}
                       </div>
                    ) : (
                       <div className="p-6 text-center text-sm text-muted-foreground">
                          No recent enrollments found.
                       </div>
                    )}
                 </CardContent>
              </Card>

              {/* Earnings Table */}
              <Card className="border-none shadow-sm bg-white dark:bg-gray-800">
                 <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                       <BarChart className="h-4 w-4 text-muted-foreground" /> Recent Earnings
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                    {earnings && earnings.length > 0 ? (
                       <div className="divide-y divide-gray-100 dark:divide-gray-700">
                          {earnings.slice(0, 5).map((earning) => {
                             const courseData = earning.courses as any;
                             const course = Array.isArray(courseData) ? courseData[0] : courseData;
                             const courseTitle = course?.title || 'Unknown Course';
                             
                             return (
                               <div key={earning.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                  <div className="min-w-0 flex-1 mr-4">
                                     <p className="font-medium text-sm truncate">{courseTitle}</p>
                                     <p className="text-xs text-muted-foreground">
                                        {new Date(earning.created_at).toLocaleDateString()}
                                     </p>
                                  </div>
                                  <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                                     +${earning.amount?.toFixed(2)}
                                  </span>
                               </div>
                             );
                          })}
                       </div>
                    ) : (
                       <div className="p-6 text-center text-sm text-muted-foreground">
                          No recent earnings found.
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