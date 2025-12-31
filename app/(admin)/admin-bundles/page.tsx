import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import AdminBundlesClient from "@/components/admin/BundleManagement";

export const metadata = {
  title: "Bundle Management - Admin",
  description: "Manage course bundles and pricing",
};

export default async function AdminBundlesPage() {
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

  if (!profile || !["super_admin", "instructor"].includes(profile.role)) {
    redirect("/sign-in");
  }

  return <AdminBundlesClient />;
}
