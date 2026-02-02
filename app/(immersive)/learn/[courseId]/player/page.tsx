import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { getCourseWithProgress } from "@/server/actions/enrollment.actions";
import { getUserReview } from "@/server/actions/review.actions";
import { CoursePlayer } from "@/components/course/player";
import { Suspense } from "react";

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
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-medium text-gray-500">Loading your course...</p>
        </div>
      </div>
    }>
      <CoursePlayer 
        course={courseData}
        sections={sections as any}
        progress={progress}
        enrollment={enrollment}
        userId={user.id}
        userReview={userReview}
      />
    </Suspense>
  );
}