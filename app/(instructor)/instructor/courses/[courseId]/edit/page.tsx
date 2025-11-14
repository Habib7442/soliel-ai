import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CourseEditWizard } from "@/components/forms/course-edit-wizard/CourseEditWizard";

interface CourseEditPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function CourseEditPage({ params }: CourseEditPageProps) {
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
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .eq('instructor_id', user.id)
    .single();
  
  if (error || !course) {
    console.error('Error fetching course:', error);
    redirect("/instructor-dashboard");
  }
  
  return (
    <div className="min-h-screen py-6 md:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Edit Course</h1>
              <p className="text-sm md:text-base text-muted-foreground">Update your course information</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <Button asChild variant="outline" size="sm" className="text-xs md:text-sm">
                <Link href={`/instructor/courses/${courseId}`}>Back to Course</Link>
              </Button>
            </div>
          </div>
        </div>
        
        <CourseEditWizard course={course} instructorId={user.id} />
      </div>
    </div>
  );
}