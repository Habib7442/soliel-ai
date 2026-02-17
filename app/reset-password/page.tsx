"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, RotateCcw } from "lucide-react";
import { UnifiedNavbar } from "@/components/layout/UnifiedNavbar";
import { Footer } from "@/components/layout/Footer";
import { useSupabase } from "@/providers/supabase-provider";

export default function ResetPasswordPage() {
  const { loading: authLoading, user: authUser } = useSupabase();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);
  const [email, setEmail] = useState("");
  const [showRequestNewLink, setShowRequestNewLink] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const error_code = urlParams.get("error_code");
      const error_description = urlParams.get("error_description");
      
      if (error_code === "otp_expired" || error_description?.includes("expired") || error_description?.includes("invalid")) {
        setLinkExpired(true);
        setError("This password reset link has expired or is invalid. Please request a new one.");
        setShowRequestNewLink(true);
      }
    }
  }, []);

  const handleRequestNewLink = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      });
      if (error) throw new Error(error.message);
      setSuccess(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send password reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <UnifiedNavbar />
      <div className="min-h-screen w-full flex items-center justify-center pt-32 pb-32 relative overflow-hidden bg-gray-50/50">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] -z-10" />

        <div className="w-full max-w-xl px-4">
          {authLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary animate-spin rounded-full mb-4" />
              <p className="text-gray-500 font-bold">Checking security certificate...</p>
            </div>
          ) : linkExpired || showRequestNewLink ? (
            <Card className="shadow-2xl border-gray-100 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="space-y-2 text-center pt-12 pb-8">
                <CardTitle className="text-4xl font-black text-gray-900 tracking-tight">
                  Link <span className="text-primary italic">Expired</span>
                </CardTitle>
                <CardDescription className="text-base font-medium text-muted-foreground/80">
                  {success ? "New reset link sent!" : "Request a new password reset link"}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-12">
                {error && !success && (
                  <Alert variant="destructive" className="mb-6 rounded-2xl border-primary/20 bg-primary/5 text-primary">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-bold">Error</AlertTitle>
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                  </Alert>
                )}
                {success ? (
                  <Alert className="mb-6 rounded-2xl border-blue-200 bg-blue-50 text-blue-700">
                    <AlertTitle className="font-bold">Email Sent</AlertTitle>
                    <AlertDescription className="font-medium">
                      Check your inbox for the new password reset link.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/20 focus:border-primary transition-all font-medium"
                      />
                    </div>
                    <Button onClick={handleRequestNewLink} className="w-full h-16 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black text-lg transition-all" disabled={loading}>
                      {loading ? "Sending..." : "Send New Link"}
                    </Button>
                  </div>
                )}
                <Button variant="outline" className="w-full h-14 rounded-2xl border-gray-100 font-bold mt-4" onClick={() => router.push("/sign-in")}>
                  Back to Sign In
                </Button>
              </CardContent>
            </Card>
          ) : success ? (
            <Card className="shadow-2xl border-gray-100 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="space-y-2 text-center pt-12 pb-8">
                <CardTitle className="text-4xl font-black text-gray-900 tracking-tight">
                  Success <span className="text-primary italic">!</span>
                </CardTitle>
                <CardDescription className="text-base font-medium text-muted-foreground/80">
                  Your password has been reset successfully
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-12">
                <Alert className="mb-8 rounded-2xl border-blue-200 bg-blue-50 text-blue-700">
                  <AlertTitle className="font-bold text-center">Security Updated</AlertTitle>
                  <AlertDescription className="font-medium text-center">
                    You can now sign in with your new password.
                  </AlertDescription>
                </Alert>
                <Button className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20 transition-all" onClick={() => router.push("/sign-in")}>
                  Go to Sign In
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-2xl border-gray-100 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="space-y-2 text-center pt-12 pb-8">
                <CardTitle className="text-4xl font-black text-gray-900 tracking-tight">
                  Reset <span className="text-primary italic">Password</span>
                </CardTitle>
                <CardDescription className="text-base font-medium text-muted-foreground/80">
                  Enter your new security credentials below
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-12">
                {error && (
                  <Alert variant="destructive" className="mb-6 rounded-2xl border-primary/20 bg-primary/5 text-primary">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-bold">Error</AlertTitle>
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">New Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/20 focus:border-primary transition-all pr-12"
                      />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent text-gray-400" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-bold text-gray-700 ml-1">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/20 focus:border-primary transition-all pr-12"
                      />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent text-gray-400" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-16 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black text-lg transition-all mt-4" disabled={loading}>
                    {loading ? "Updating..." : (
                      <span className="flex items-center justify-center gap-2">
                        Reset Password
                        <RotateCcw className="w-5 h-5 opacity-50" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}