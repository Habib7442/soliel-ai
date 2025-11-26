import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { getCourseWithProgress } from "@/server/actions/enrollment.actions";
import { CoursePlayer } from "@/components/course/player";

interface CoursePlayerPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function CoursePlayerPage({ params }: CoursePlayerPageProps) {
  const { courseId } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Fetch course with progress
  const result = await getCourseWithProgress(user.id, courseId);
  
  if (!result.success || !result.data) {
    redirect("/student-dashboard");
  }
  
  const { course, sections, progress, enrollment } = result.data;
  
  return (
    <CoursePlayer 
      course={course}
      sections={sections}
      progress={progress}
      enrollment={enrollment}
      userId={user.id}
    />
  );
}