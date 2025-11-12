"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface SignOutProps {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function SignOut({ children, variant = "outline", size = "default" }: SignOutProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

const handleSignOut = async () => {
  console.log('Signout initiated');
  setLoading(true);
  
  try {
    console.log('Calling supabase.auth.signOut()');
    
    // Sign out with global scope to clear all sessions
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    console.log('Supabase signOut response:', { error });
    
    if (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
      setLoading(false);
      return; // Don't redirect if there's an error
    }
    
    console.log('Signout successful, redirecting to home page');
    toast.success('You have been signed out successfully.');
    
    // Wait a moment for the toast to show, then redirect
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Use Next.js router for navigation
    router.push('/');
    router.refresh(); // Refresh to clear any cached data
    
  } catch (error) {
    console.error('Sign out error:', error);
    toast.error(`Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    setLoading(false);
  }
};

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} disabled={loading}>
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign Out</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to sign out? You will need to sign in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSignOut} 
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Signing Out...
              </div>
            ) : (
              "Sign Out"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}