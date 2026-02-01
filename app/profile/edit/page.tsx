import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import EditProfileForm from "./edit-profile-form";

export default async function EditProfilePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <EditProfileForm user={user} profile={profile} />
  );
}
