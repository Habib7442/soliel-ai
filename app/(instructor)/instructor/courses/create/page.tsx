import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CourseCreateForm } from "@/components/forms/course-create-form";

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
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-3xl mb-2">Create New Course</CardTitle>
            <CardDescription>
              Fill in the basic information for your new course. You can edit these details later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CourseCreateForm instructorId={user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}