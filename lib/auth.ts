import { createServerClient } from "@/lib/supabase-server";

export async function getCurrentUser() {
  const supabase = await createServerClient();
  // Use getUser() instead of getSession() for security
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

export async function getProfile() {
  const supabase = await createServerClient();
  // Use getUser() instead of getSession() for security
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  // Get user profile from profiles table
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function getUserRole() {
  const profile = await getProfile();
  return profile?.role || 'student';
}

export async function isAdmin() {
  const role = await getUserRole();
  return role === 'super_admin';
}

export async function isInstructor() {
  const role = await getUserRole();
  return role === 'instructor' || role === 'super_admin';
}

export async function isCompanyAdmin() {
  const role = await getUserRole();
  return role === 'company_admin' || role === 'super_admin';
}