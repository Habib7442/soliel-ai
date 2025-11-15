import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getCourseStudents } from "@/server/actions/instructor.actions";
import { ChevronLeft } from "lucide-react";

interface Student {
  id: string;
  enrollment_id: string;
  full_name: string;
  email: string;
  enrollment_date: string;
  progress_percent: number;
  last_activity: string | null;
}

interface StudentsPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function StudentsPage({ params }: StudentsPageProps) {
  const { courseId } = await params;
  
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== UserRole.INSTRUCTOR && profile?.role !== UserRole.SUPER_ADMIN) {
    redirect("/sign-in");
  }
  
  // Fetch course data
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .eq('instructor_id', user.id)
    .single();
  
  if (!course) {
    redirect("/instructor-dashboard");
  }
  
  // Fetch students using our new server action
  const studentsResult = await getCourseStudents(courseId);
  const studentsData = studentsResult.success ? studentsResult.data : [];
  const students: Student[] = Array.isArray(studentsData) ? studentsData : [];
  
  // Calculate one week ago for active students filter
  const oneWeekAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
  

  
  // Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Get completion status based on progress
  const getCompletionStatus = (progress: number) => {
    if (progress === 100) return 'Completed';
    if (progress > 0) return 'In Progress';
    return 'Not Started';
  };
  
  // Get status badge variant based on progress
  const getStatusVariant = (progress: number) => {
    if (progress === 100) return 'default';
    if (progress > 0) return 'secondary';
    return 'outline';
  };
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/instructor/courses/${courseId}`}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Link>
          </Button>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-2xl md:text-3xl mb-2">{course.title}</CardTitle>
                <CardDescription>Manage your students and track their progress</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Send Announcement</Button>
                <Button>Export Data</Button>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Enrolled Students</CardTitle>
            <CardDescription>
              {students.length} student{students.length !== 1 ? 's' : ''} enrolled in this course
            </CardDescription>
          </CardHeader>
          <CardContent>
            {students && students.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Enrollment Date</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.enrollment_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{student.full_name}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(student.enrollment_date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${student.progress_percent}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{student.progress_percent}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {student.last_activity ? formatDate(student.last_activity) : 'No activity'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(student.progress_percent)}>
                            {getCompletionStatus(student.progress_percent)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View Progress</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No students enrolled in this course yet.</p>
                <Button asChild>
                  <Link href={`/courses/${courseId}`}>View Course Details</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Student Engagement Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Completion Rate</CardTitle>
              <CardDescription>Average course completion</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {students.length > 0 
                  ? Math.round(students.filter(s => s.progress_percent === 100).length / students.length * 100) 
                  : 0}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Students</CardTitle>
              <CardDescription>Students with recent activity</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {students.length > 0 ? students.filter(s => s.last_activity && new Date(s.last_activity).getTime() > oneWeekAgo).length : 0}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Avg. Progress</CardTitle>
              <CardDescription>Average progress across all students</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {students.length > 0 
                  ? Math.round(students.reduce((sum, s) => sum + s.progress_percent, 0) / students.length) 
                  : 0}%
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}