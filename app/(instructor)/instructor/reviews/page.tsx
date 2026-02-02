import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import ReviewsDashboard from "@/components/instructor/reviews/ReviewsDashboard";

export const metadata = {
  title: "Student Reviews - Instructor Portal",
  description: "Manage and respond to student reviews across all your courses",
};

export default async function ReviewsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== UserRole.INSTRUCTOR && profile.role !== UserRole.SUPER_ADMIN)) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white selection:bg-primary selection:text-white pb-20">
      {/* Background Pattern & Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
         <ReviewsDashboard instructorId={user.id} />
      </div>
    </div>
  );
}
