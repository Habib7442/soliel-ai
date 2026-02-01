import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import InstructorBundleManagement from "@/components/instructor/InstructorBundleManagement";

export const metadata = {
  title: "Bundle Management - Instructor",
  description: "Create and manage your course bundles",
};

export default async function InstructorBundlesPage() {
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

  return <InstructorBundleManagement userId={user.id} />;
}
