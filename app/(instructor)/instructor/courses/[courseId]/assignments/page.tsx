import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { Button } from "@/components/ui/button";
import { AssignmentManager } from "@/components/instructor/AssignmentManager";
import { ChevronLeft } from "lucide-react";

interface AssignmentsPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function AssignmentsPage({ params }: AssignmentsPageProps) {
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
  
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .eq('instructor_id', user.id)
    .single();
  
  if (!course) {
    redirect("/instructor-dashboard");
  }
  
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

        <AssignmentManager courseId={courseId} />
      </div>
    </div>
  );
}
