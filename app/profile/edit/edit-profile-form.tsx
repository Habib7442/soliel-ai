"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserProfile } from "@/server/actions/user.actions";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ChevronLeft, Save, User, Camera, Mail } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

interface EditProfileFormProps {
  user: {
    id: string;
    email?: string;
  };
  profile: Profile | null;
}

export default function EditProfileForm({ user, profile: initialProfile }: EditProfileFormProps) {
  // Initialize state with props
  const [fullName, setFullName] = useState(initialProfile?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // effective profile fallback
  const displayEmail = initialProfile?.email || user.email || "";
  const displayAvatar = avatarUrl || initialProfile?.avatar_url || "";

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const result = await updateUserProfile({
        id: user.id,
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

  return (
    <div className="min-h-screen relative overflow-hidden bg-white selection:bg-primary selection:text-white pb-20">
      {/* Background Pattern & Blobs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] -z-10" />

      {/* Header Container */}
      <div className="relative pt-6 pb-6 border-b border-gray-100/50 backdrop-blur-sm bg-white/30 sticky top-0 z-40">
        <div className="container mx-auto px-4 max-w-3xl flex items-center justify-between gap-4">
           <Button variant="ghost" size="sm" asChild className="rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all font-bold">
              <Link href="/profile">
                 <ChevronLeft className="h-4 w-4 mr-2" />
                 Back to Intel
              </Link>
           </Button>
           
           <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Profile Architect</span>
           </div>
           
           <div className="w-[100px] hidden sm:block" />
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl py-12 relative z-10">
        <Card className="border-0 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] bg-white/70 backdrop-blur-3xl rounded-[3rem] overflow-hidden border border-white/50">
           <div className="h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative" />
           
           <CardContent className="px-8 md:px-12 pb-12 -mt-16">
              <div className="flex flex-col items-center mb-10">
                 <div className="relative group">
                    <div className="p-1.5 rounded-[2.5rem] bg-white shadow-2xl shadow-primary/20 backdrop-blur-sm group-hover:scale-105 transition-transform duration-500">
                       <Avatar className="h-28 w-28 rounded-[2rem] border-0">
                          <AvatarImage src={displayAvatar} className="object-cover" />
                          <AvatarFallback className="text-3xl bg-primary/10 text-primary font-black italic">
                             {displayEmail?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                       </Avatar>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-gray-900 text-white p-2.5 rounded-2xl ring-4 ring-white shadow-xl group-hover:rotate-12 transition-all">
                       <Camera className="h-4 w-4" />
                    </div>
                 </div>
                 <h2 className="mt-8 text-3xl font-black text-gray-900 tracking-tighter text-center">
                    Refine your <span className="text-primary italic">Presence.</span>
                 </h2>
                 <p className="text-muted-foreground px-4 text-center text-sm font-medium mt-2 max-w-md leading-relaxed">
                    Update your digital identity to align with your evolving expertise.
                 </p>
              </div>

              <div className="space-y-8 max-w-md mx-auto">
                 <div className="space-y-6">
                    <div className="space-y-3">
                       <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                          Secured Email
                       </Label>
                       <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-primary transition-colors" />
                          <Input 
                             id="email" 
                             value={displayEmail} 
                             disabled 
                             className="h-14 pl-12 rounded-2xl bg-gray-50/50 border-gray-100 text-gray-400 cursor-not-allowed font-bold" 
                          />
                       </div>
                       <p className="text-[9px] text-muted-foreground ml-1 font-bold">
                          Account identifier is permanently encrypted.
                       </p>
                    </div>
                    
                    <div className="space-y-3">
                       <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                          Full Designation
                       </Label>
                       <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-primary transition-colors" />
                          <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="How should the world address you?"
                            className="h-14 pl-12 rounded-2xl border-gray-100 focus:border-primary focus:ring-primary/10 transition-all font-black"
                          />
                       </div>
                    </div>
                    
                    <div className="space-y-3">
                       <Label htmlFor="avatarUrl" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                          Visual Identity Link
                       </Label>
                       <div className="relative group">
                          <Camera className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-primary transition-colors" />
                          <Input
                            id="avatarUrl"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="Paste high-resolution imagery URL"
                            className="h-14 pl-12 rounded-2xl border-gray-100 focus:border-primary focus:ring-primary/10 transition-all font-medium text-xs italic"
                          />
                       </div>
                       <p className="text-[9px] text-muted-foreground ml-1 font-bold">
                          Direct links to PNG or JPG are recommended.
                       </p>
                    </div>
                 </div>
                 
                 {error && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100/50 text-red-600 text-xs font-bold animate-in fade-in zoom-in-95 duration-300">
                       <div className="flex gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1" />
                          {error}
                       </div>
                    </div>
                 )}
                 
                 <div className="flex gap-4 pt-4">
                    <Button 
                       variant="outline" 
                       onClick={() => router.push("/profile")}
                       className="flex-1 h-14 rounded-2xl font-black tracking-tight border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
                    >
                       Discard
                    </Button>
                    <Button 
                       onClick={handleSave} 
                       disabled={saving}
                       className="flex-[2] h-14 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black tracking-tight shadow-xl shadow-black/10 transition-all active:scale-95 border-0"
                    >
                       {saving ? (
                          <div className="flex items-center gap-3">
                             <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             Saving...
                          </div>
                       ) : (
                          <div className="flex items-center gap-2">
                             <Save className="h-4 w-4" />
                             Save Intel
                          </div>
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
