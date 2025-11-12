import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { getStudentEnrolledCourses, getStudentCertificates, getStudentProgress } from "@/server/actions/student.actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

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
    getStudentEnrolledCourses(user.id),
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
                  {courses.map((enrollment) => (
                    <Card key={enrollment.id} className="p-4 hover:shadow-md transition-shadow">
                      <CardTitle className="font-semibold text-lg mb-2">
                        {enrollment.courses && enrollment.courses.length > 0 
                          ? enrollment.courses[0].title 
                          : 'Untitled Course'}
                      </CardTitle>
                      <CardDescription className="text-sm mb-4 line-clamp-2">
                        {enrollment.courses && enrollment.courses.length > 0 
                          ? enrollment.courses[0].description 
                          : 'No description available'}
                      </CardDescription>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary">
                          ${enrollment.courses && enrollment.courses.length > 0 
                            ? enrollment.courses[0].price 
                            : 0}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Instructor: {
                            enrollment.courses && 
                            enrollment.courses.length > 0 && 
                            enrollment.courses[0].user_profiles &&
                            enrollment.courses[0].user_profiles.length > 0
                              ? enrollment.courses[0].user_profiles[0].full_name 
                              : 'Unknown Instructor'
                          }
                        </span>
                      </div>
                    </Card>
                  ))}
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
                      {progress.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.lessons && Array.isArray(item.lessons) && item.lessons.length > 0 && item.lessons[0].courses && Array.isArray(item.lessons[0].courses) && item.lessons[0].courses.length > 0
                              ? item.lessons[0].courses[0].title
                              : 'Unknown Course'}
                          </TableCell>
                          <TableCell>
                            {item.lessons && Array.isArray(item.lessons) && item.lessons.length > 0
                              ? item.lessons[0].title
                              : 'Unknown Lesson'}
                          </TableCell>
                          <TableCell>
                            {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground">No progress yet.</p>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">Continue Learning</CardTitle>
                <CardDescription className="mb-4">Resume your in-progress courses</CardDescription>
                <Button>View Courses</Button>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">Browse Courses</CardTitle>
                <CardDescription className="mb-4">Discover new courses to learn</CardDescription>
                <Button variant="secondary">Browse Courses</Button>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">My Certificates</CardTitle>
                <CardDescription className="mb-4">View and download your certificates</CardDescription>
                <Button variant="secondary">View Certificates</Button>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}