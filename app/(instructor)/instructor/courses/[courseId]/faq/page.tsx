import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FaqManager } from "@/components/instructor/FaqManager";
import { ChevronLeft } from "lucide-react";

interface FaqPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function FaqPage({ params }: FaqPageProps) {
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>FAQ Management Tips</CardTitle>
              <CardDescription>Best practices for organizing your course FAQs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                • Use categories to group related questions (e.g., &quot;Enrollment&quot;, &quot;Technical&quot;, &quot;Content&quot;)
              </p>
              <p className="text-sm">
                • Write clear, concise questions that students commonly ask
              </p>
              <p className="text-sm">
                • Use Markdown formatting in answers for better readability
              </p>
              <p className="text-sm">
                • Regularly review and update FAQs based on new student questions
              </p>
            </CardContent>
          </Card>
          <FaqManager courseId={courseId} />
        </div>
      </div>
    </div>
  );
}
