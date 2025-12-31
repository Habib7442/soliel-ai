import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import CompanyManagement from "@/components/admin/CompanyManagement";

export const metadata = {
  title: "Company Management - Admin",
  description: "Manage company accounts and corporate packages",
};

export default async function AdminCompaniesPage() {
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

  if (profile?.role !== UserRole.SUPER_ADMIN) {
    redirect("/sign-in");
  }

  return <CompanyManagement />;
}
