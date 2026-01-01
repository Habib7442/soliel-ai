"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserProfile } from "@/server/actions/user.actions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { ChevronLeft, Save, User, Loader2, Camera, Mail } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

export default function EditProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          router.push('/sign-in');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          toast.error('Failed to load profile');
          setLoading(false);
        } else if (data) {
          setProfile(data as Profile);
          setFullName(data.full_name || "");
          setAvatarUrl(data.avatar_url || "");
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error:', err);
        toast.error('An error occurred');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError(null);

    try {
      const result = await updateUserProfile({
        id: profile.id,
        fullName,
        avatarUrl,
      });

      if (!result.success) {
        setError(result.error || "Failed to update profile");
        toast.error("Failed to update profile", {
          description: result.error || "Please try again"
        });
      } else {
        toast.success("Profile updated successfully!");
        router.push("/profile");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
         <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading profile...</p>
         </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center">
         <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
               <Link href="/profile">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Profile
               </Link>
            </Button>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 hidden sm:block">
               Edit Profile
            </h1>
            <div className="w-[100px] sm:hidden" />
         </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <Card className="border-none shadow-xl bg-white dark:bg-gray-900 overflow-hidden">
           <div className="h-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-900/10 dark:to-purple-900/10 border-b border-gray-100 dark:border-gray-800" />
           
           <CardContent className="px-6 md:px-10 pb-10 -mt-12">
              <div className="flex flex-col items-center mb-8">
                 <div className="relative group">
                    <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-900 shadow-lg">
                       <AvatarImage src={avatarUrl || profile.avatar_url || ""} />
                       <AvatarFallback className="text-2xl bg-gray-100 dark:bg-gray-800">
                          {profile.email?.charAt(0).toUpperCase()}
                       </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full ring-2 ring-white dark:ring-gray-900 shadow-sm">
                       <Camera className="h-3 w-3" />
                    </div>
                 </div>
                 <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">
                    Edit Your Profile
                 </h2>
                 <p className="text-muted-foreground text-center text-sm max-w-sm mt-1">
                    Update your personal information and public profile details.
                 </p>
              </div>

              <div className="space-y-6 max-w-lg mx-auto">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <Label htmlFor="email" className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" /> Email Address
                       </Label>
                       <Input 
                          id="email" 
                          value={profile.email} 
                          disabled 
                          className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-muted-foreground cursor-not-allowed" 
                       />
                       <p className="text-xs text-muted-foreground ml-1">
                          Your email address cannot be changed.
                       </p>
                    </div>
                    
                    <div className="space-y-2">
                       <Label htmlFor="fullName" className="flex items-center gap-2">
                          <User className="h-3 w-3" /> Full Name
                       </Label>
                       <Input
                         id="fullName"
                         value={fullName}
                         onChange={(e) => setFullName(e.target.value)}
                         placeholder="e.g. John Doe"
                         className="h-11"
                       />
                    </div>
                    
                    <div className="space-y-2">
                       <Label htmlFor="avatarUrl" className="flex items-center gap-2">
                          <Camera className="h-3 w-3" /> Avatar URL
                       </Label>
                       <Input
                         id="avatarUrl"
                         value={avatarUrl}
                         onChange={(e) => setAvatarUrl(e.target.value)}
                         placeholder="https://example.com/your-photo.jpg"
                         className="h-11"
                       />
                       <p className="text-xs text-muted-foreground ml-1">
                          Paste a direct link to an image (png, jpg).
                       </p>
                    </div>
                 </div>
                 
                 {error && (
                   <div className="text-red-600 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                      {error}
                   </div>
                 )}
                 
                 <div className="flex gap-4 pt-4">
                    <Button 
                       variant="outline" 
                       onClick={() => router.push("/profile")}
                       className="flex-1 h-11"
                    >
                       Cancel
                    </Button>
                    <Button 
                       onClick={handleSave} 
                       disabled={saving}
                       className="flex-1 h-11 relative"
                    >
                       {saving ? (
                          <>
                             <Loader2 className="h-4 w-4 animate-spin mr-2" />
                             Saving...
                          </>
                       ) : (
                          <>
                             <Save className="h-4 w-4 mr-2" />
                             Save Changes
                          </>
                       )}
                    </Button>
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}