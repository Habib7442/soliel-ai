import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { EarningsDashboard } from "@/components/instructor/EarningsDashboard";

export default async function EarningsPage() {
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
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EarningsDashboard instructorId={user.id} />
      </div>
    </div>
  );
}
