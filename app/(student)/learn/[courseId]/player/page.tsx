import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { getCourseWithProgress } from "@/server/actions/enrollment.actions";
import { getUserReview } from "@/server/actions/review.actions";
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
  
  // Fix profiles type - Supabase returns array, we need object
  const profiles = Array.isArray(course.profiles) ? course.profiles[0] : course.profiles;
  const courseData = {
    id: course.id,
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    thumbnail_url: course.thumbnail_url,
    instructor_id: course.instructor_id,
    profiles: profiles as { full_name?: string; avatar_url?: string } | undefined,
  };
  
  // Fetch user's review if exists
  const reviewResult = await getUserReview(user.id, courseId);
  const userReview = reviewResult.success ? reviewResult.data : null;
  
  return (
    <CoursePlayer 
      course={courseData}
      sections={sections}
      progress={progress}
      enrollment={enrollment}
      userId={user.id}
      userReview={userReview}
    />
  );
}