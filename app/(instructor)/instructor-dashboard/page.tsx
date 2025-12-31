import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { getInstructorCourses, getCourseEarnings, getStudentEnrollments, deleteCourse } from "@/server/actions/instructor.actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DeleteCourseButton } from "@/components/instructor/DeleteCourseButton";

export default async function InstructorDashboardPage() {
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
  
  // If not an instructor, redirect to appropriate dashboard
  // Role-based redirects are handled in page components
  if (profile?.role !== UserRole.INSTRUCTOR && profile?.role !== UserRole.SUPER_ADMIN) {
    redirect("/sign-in");
  }
  
  // Fetch dashboard data using server actions
  const [coursesResult, earningsResult, enrollmentsResult] = await Promise.all([
    getInstructorCourses(user.id),
    getCourseEarnings(user.id),
    getStudentEnrollments(user.id)
  ]);
  
  const courses = coursesResult.success ? coursesResult.data : [];
  const earnings = earningsResult.success ? earningsResult.data : [];
  const enrollments = enrollmentsResult.success ? enrollmentsResult.data : [];
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">Instructor Dashboard</CardTitle>
                <CardDescription>
                  Welcome to your instructor dashboard. Here you can manage your courses, view analytics, and interact with students.
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
                <Button asChild variant="outline">
                  <Link href="/admin-bundles">Manage Bundles</Link>
                </Button>
                <Button asChild>
                  <Link href="/instructor/courses/create">Create New Course</Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6">
                <CardTitle className="text-lg font-semibold mb-2">Total Courses</CardTitle>
                <p className="text-3xl font-bold text-primary">{courses?.length || 0}</p>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-lg font-semibold mb-2">Total Students</CardTitle>
                <p className="text-3xl font-bold text-primary">
                  {enrollments?.length || 0}
                </p>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-lg font-semibold mb-2">Total Revenue</CardTitle>
                <p className="text-3xl font-bold text-primary">
                  ${earnings?.reduce((acc, earning) => acc + (earning.amount || 0), 0).toFixed(2) || '0.00'}
                </p>
              </Card>
            </div>
            
            {/* Recent Courses */}
            <div className="mb-8">
              <CardTitle className="text-2xl mb-4">Your Courses</CardTitle>
              {courses && courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => {
                    return (
                      <Card 
                        key={course.id} 
                        className="hover:shadow-md transition-all duration-300 backdrop-blur-sm bg-background/30 border border-border/50 dark:bg-background/20 dark:border-border/30 flex flex-col"
                      >
                        <CardContent className="pt-6 flex-1">
                          <CardTitle className="font-semibold text-lg mb-2">{course.title}</CardTitle>
                          <CardDescription className="text-sm mb-4 line-clamp-2">{course.subtitle}</CardDescription>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-primary">${(course.price_cents / 100).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <span className="text-sm text-muted-foreground">{course.level}</span>
                            {course.is_published ? (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded dark:bg-green-900/30 dark:text-green-300">Published</span>
                            ) : (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded capitalize dark:bg-yellow-900/30 dark:text-yellow-300">
                                {course.status}
                              </span>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="flex gap-2 pt-4">
                          <Button asChild size="sm" className="flex-1">
                            <Link href={`/instructor/courses/${course.id}`}>Manage Course</Link>
                          </Button>
                          <DeleteCourseButton courseId={course.id} />
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">You haven&apos;t created any courses yet.</p>
                  <Button asChild>
                    <Link href="/instructor/courses/create">Create Your First Course</Link>
                  </Button>
                </div>
              )}
            </div>
            
            {/* Recent Earnings */}
            <div className="mb-8">
              <CardTitle className="text-2xl mb-4">Recent Earnings</CardTitle>
              {earnings && earnings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {earnings.map((earning) => (
                        <TableRow key={earning.id}>
                          <TableCell className="font-medium">
                            {earning.courses && Array.isArray(earning.courses) && earning.courses.length > 0 
                              ? earning.courses[0].title 
                              : 'Unknown Course'}
                          </TableCell>
                          <TableCell className="font-medium text-primary">
                            ${earning.amount?.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {earning.created_at ? new Date(earning.created_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground">No earnings yet.</p>
              )}
            </div>
            
            {/* Recent Enrollments */}
            <div className="mb-8">
              <CardTitle className="text-2xl mb-4">Recent Enrollments</CardTitle>
              {enrollments && enrollments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.slice(0, 5).map((enrollment, index) => (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">
                            Student {index + 1}
                          </TableCell>
                          <TableCell>
                            {enrollment.courses && Array.isArray(enrollment.courses) && enrollment.courses.length > 0
                              ? enrollment.courses[0].title
                              : 'Course'}
                          </TableCell>
                          <TableCell>
                            {enrollment.created_at ? new Date(enrollment.created_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground">No student enrollments yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}