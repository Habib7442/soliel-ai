import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { getStudentEnrolledCourses, getStudentCertificates, getStudentProgress } from "@/server/actions/student.actions";
import { getStudentEnrolledCourses as getEnrollmentsWithProgress } from "@/server/actions/enrollment.actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function StudentDashboardPage() {
  const supabase = await createServerClient();
  // Use getUser() instead of getSession() for security
  const { data: { user } } = await supabase.auth.getUser();
  
  // If no user, redirect to sign in
  if (!user) {
    redirect("/sign-in");
  }
  
  // Get user profile to verify role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  // If not a student, redirect to appropriate dashboard
  // Role-based redirects are handled in page components
  if (profile?.role !== UserRole.STUDENT) {
    redirect("/sign-in");
  }
  
  // Fetch dashboard data using server actions
  const [coursesResult, certificatesResult, progressResult] = await Promise.all([
    getEnrollmentsWithProgress(user.id),
    getStudentCertificates(user.id),
    getStudentProgress(user.id)
  ]);
  
  const courses = coursesResult.success ? coursesResult.data : [];
  const certificates = certificatesResult.success ? certificatesResult.data : [];
  const progress = progressResult.success ? progressResult.data : [];
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-3xl mb-2">Student Dashboard</CardTitle>
            <CardDescription>
              Welcome to your learning dashboard. Here you can access your enrolled courses, track your progress, and view your certificates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6">
                <CardTitle className="text-lg font-semibold mb-2">Enrolled Courses</CardTitle>
                <p className="text-3xl font-bold text-primary">{courses?.length || 0}</p>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-lg font-semibold mb-2">Certificates</CardTitle>
                <p className="text-3xl font-bold text-primary">{certificates?.length || 0}</p>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-lg font-semibold mb-2">Lessons Completed</CardTitle>
                <p className="text-3xl font-bold text-primary">{progress?.length || 0}</p>
              </Card>
            </div>
            
            {/* Enrolled Courses */}
            <div className="mb-8">
              <CardTitle className="text-2xl mb-4">Your Courses</CardTitle>
              {courses && courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((enrollment) => {
                    const courseData = (Array.isArray(enrollment.courses) && enrollment.courses.length > 0 
                      ? enrollment.courses[0] 
                      : enrollment.courses) as { 
                        id?: string; 
                        title?: string; 
                        subtitle?: string; 
                        description?: string;
                        profiles?: { full_name?: string };
                      };
                    const progress = enrollment.progress || { progress_percent: 0, total_lessons: 0, completed_lessons: 0 };
                    
                    return (
                    <Card key={enrollment.id} className="hover:shadow-md transition-shadow flex flex-col">
                      <CardContent className="pt-6 flex-1">
                      <CardTitle className="font-semibold text-lg mb-2">
                        {courseData?.title || 'Untitled Course'}
                      </CardTitle>
                      <CardDescription className="text-sm mb-4 line-clamp-2">
                        {courseData?.subtitle || courseData?.description || 'No description available'}
                      </CardDescription>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold text-primary">{progress.progress_percent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-[#FF0000] to-[#CC0000] h-2 rounded-full transition-all"
                            style={{ width: `${Math.max(0, progress.progress_percent)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {progress.completed_lessons} of {progress.total_lessons} lessons completed
                        </p>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        by {courseData?.profiles?.full_name || 'Unknown'}
                      </div>
                      </CardContent>
                      
                      <CardFooter className="pt-4">
                        <Button asChild size="sm" className="w-full">
                          <Link href={`/learn/${courseData?.id}/player`}>
                            {progress.progress_percent > 0 ? 'Continue' : 'Start'}
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">You haven&apos;t enrolled in any courses yet.</p>
              )}
            </div>
            
            {/* Recent Progress */}
            <div className="mb-8">
              <CardTitle className="text-2xl mb-4">Recent Progress</CardTitle>
              {progress && progress.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Lesson</TableHead>
                        <TableHead>Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {progress.map((item) => {
                        // Handle both object and array formats from Supabase
                        const lesson = Array.isArray(item.lessons) ? item.lessons[0] : item.lessons;
                        const course = lesson?.courses ? (Array.isArray(lesson.courses) ? lesson.courses[0] : lesson.courses) : null;
                        
                        return (
                          <TableRow key={`${item.user_id}-${item.lesson_id}`}>
                            <TableCell>
                              {course?.title || 'Unknown Course'}
                            </TableCell>
                            <TableCell>
                              {lesson?.title || 'Unknown Lesson'}
                            </TableCell>
                            <TableCell>
                              {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : 'N/A'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground">No progress yet.</p>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">Browse Courses</CardTitle>
                <CardDescription className="mb-4">Discover new courses to learn</CardDescription>
                <Button asChild>
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">My Profile</CardTitle>
                <CardDescription className="mb-4">Manage your account settings</CardDescription>
                <Button variant="secondary" asChild>
                  <Link href="/profile">View Profile</Link>
                </Button>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}