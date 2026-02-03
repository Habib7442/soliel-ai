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
import * as Sentry from "@sentry/nextjs";

interface SignOutProps {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "xl";
  className?: string;
}

export function SignOut({ children, variant = "outline", size = "default", className }: SignOutProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

const handleSignOut = async (e: React.MouseEvent<HTMLButtonElement>) => {
  // Prevent dialog from closing immediately
  e.preventDefault();
  
  return Sentry.startSpan(
    {
      op: "ui.click",
      name: "Sign Out Button Click",
    },
    async (span) => {
      setLoading(true);
      
      try {
        // Aggressively clear client-side storage to remove any stuck tokens
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.clear();
            window.sessionStorage.clear();
          } catch (storageError) {
            Sentry.captureException(storageError);
            console.error("Error clearing storage", storageError);
          }
          
          // Attempt to clear Supabase specific cookies if reachable via script
          document.cookie.split(";").forEach((c) => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
        }
        
        // Create a timeout promise to prevent hanging
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => resolve({ error: { message: "Sign out timed out" } }), 3000);
        });
        
        // Race between actual sign out and timeout
        const { error } = await Promise.race([
          supabase.auth.signOut({ scope: 'global' }),
          timeoutPromise
        ]) as { error: any };
        
        if (error) {
          Sentry.captureException(error);
          console.warn("Supabase signOut error or timeout (ignoring and forcing disconnect):", error);
        }
        
        const { logger } = Sentry;
        logger.info("User signed out successfully");
        toast.success('You have been signed out.');
      } catch (error) {
        Sentry.captureException(error);
        console.error('Sign out critical error:', error);
      } finally {
        // ALWAYS redirect, even if errors occurred
        // Use window.location for hard redirect to clear all state with cache buster
        window.location.href = `/?refresh=${Date.now()}`;
      }
    }
  );
};

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} disabled={loading} className={className}>
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-[2.5rem] border-0 bg-white/95 backdrop-blur-2xl shadow-2xl p-8 max-w-md">
        <AlertDialogHeader className="space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </div>
          <AlertDialogTitle className="text-2xl font-black text-gray-900 tracking-tight">
            Sign <span className="text-red-600 italic">Out?</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base font-medium text-muted-foreground/80 leading-relaxed">
            Are you sure you want to end your session? You will need to re-authenticate to access your <span className="text-gray-900 font-bold underline decoration-red-500/30">personalized experience.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8 gap-3 sm:gap-0">
          <AlertDialogCancel className="h-14 rounded-xl border-gray-100 font-bold hover:bg-gray-50 transition-all active:scale-95">
            Stay Connected
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSignOut} 
            disabled={loading}
            className="h-14 rounded-xl bg-red-600 text-white font-black hover:bg-red-700 border-0 shadow-xl shadow-red-600/20 transition-all active:scale-95"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                Ending Session...
              </div>
            ) : (
              "Yes, Sign Out"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

}