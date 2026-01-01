import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { getCourseStudents } from "@/server/actions/instructor.actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, TrendingUp, Activity, Download } from "lucide-react";
import Link from "next/link";
import { StudentsTable } from "@/components/instructor/StudentsTable";

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
  
  // Verify instructor owns this course
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, instructor_id')
    .eq('id', courseId)
    .single();
  
  if (!course || course.instructor_id !== user.id) {
    redirect("/instructor-dashboard");
  }
  
  // Fetch students data
  const studentsResult = await getCourseStudents(courseId);
  const students = studentsResult.success && studentsResult.data ? studentsResult.data : [];
  
  // Pre-calculate timestamp for active students check (outside render to avoid impure function)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Calculate stats
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.last_activity && 
    new Date(s.last_activity) > sevenDaysAgo
  ).length;
  
  const avgProgress = totalStudents > 0
    ? Math.round(students.reduce((sum, s) => sum + s.progress_percent, 0) / totalStudents)
    : 0;
  
  const completionRate = totalStudents > 0
    ? Math.round((students.filter(s => s.progress_percent === 100).length / totalStudents) * 100)
    : 0;
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/instructor/courses/${courseId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Link>
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{course.title}</h1>
              <p className="text-muted-foreground mt-1">Manage your students and track their progress</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-[#FF0000]" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Enrolled in this course
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                Active Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active in last 7 days
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Avg. Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgProgress}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Average progress across all students
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Students who completed the course
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Students</CardTitle>
            <CardDescription>
              {totalStudents} {totalStudents === 1 ? 'student' : 'students'} enrolled in this course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudentsTable students={students} courseId={courseId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
