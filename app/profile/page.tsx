import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function ProfilePage() {
  const supabase = await createServerClient();
  // Use getUser() instead of getSession() for security
  const { data: { user } } = await supabase.auth.getUser();
  
  // If no user, redirect to sign in
  if (!user) {
    redirect("/sign-in");
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-6 backdrop-blur-sm bg-background/30 border border-border/50 dark:bg-background/20 dark:border-border/30">
          <CardHeader>
            <CardTitle className="text-3xl mb-6">Your Profile</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
                <p className="text-lg">{profile?.full_name || "Not set"}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                <p className="text-lg">{profile?.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Role</label>
                <p className="text-lg capitalize">{profile?.role || "student"}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Member Since</label>
                <p className="text-lg">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Bio</label>
                <p className="text-lg">{profile?.bio || "No bio provided"}</p>
              </div>
              
              <div className="pt-4">
                <Button asChild>
                  <Link href="/profile/edit">
                    Edit Profile
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}