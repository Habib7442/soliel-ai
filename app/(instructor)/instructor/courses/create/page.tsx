import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { CourseWizard } from "@/components/forms/course-wizard/CourseWizard";

export default async function CreateCoursePage() {
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
  if (profile?.role !== UserRole.INSTRUCTOR && profile?.role !== UserRole.SUPER_ADMIN) {
    redirect("/sign-in");
  }
  
  return (
    <div className="min-h-screen py-4 md:py-8">
      <CourseWizard instructorId={user.id} />
    </div>
  );
}