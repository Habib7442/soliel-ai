"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/types/enums";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, RotateCcw } from "lucide-react";
import { Loading } from "@/components/ui/loading";

interface AuthFormProps {
  mode: "signup" | "login";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showResendLink, setShowResendLink] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Check if we have an error from email verification
  // Only run this on the client side after mounting
  useEffect(() => {
    // This will only run on the client side
    if (typeof window !== 'undefined') {
      // Get search params from window.location
      const urlParams = new URLSearchParams(window.location.search);
      const error_code = urlParams.get("error_code");
      if (error_code === "otp_expired") {
        setShowResendLink(true);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        // Sign up the user
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });

        if (signUpError) {
          throw new Error(signUpError.message);
        }

        // Redirect to appropriate dashboard based on role
        // The profile will be automatically created by the database trigger
        if (role === UserRole.INSTRUCTOR) {
          router.push("/instructor-dashboard");
        } else if (role === UserRole.COMPANY_ADMIN) {
          router.push("/company-dashboard");
        } else {
          router.push("/student-dashboard");
        }
      } else {
        // Login the user
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          throw new Error(loginError.message);
        }

        // Get user role and redirect accordingly
        // Use getUser() instead of relying on session for security
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check if there's a redirect parameter in the URL
          const urlParams = new URLSearchParams(window.location.search);
          const redirectPath = urlParams.get('redirect');
          
          if (redirectPath) {
            // If there's a redirect parameter, use it
            router.push(redirectPath);
          } else {
            // Otherwise, redirect based on role
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();

            if (profile) {
              if (profile.role === UserRole.INSTRUCTOR) {
                router.push("/instructor-dashboard");
              } else if (profile.role === UserRole.COMPANY_ADMIN) {
                router.push("/company-dashboard");
              } else if (profile.role === UserRole.SUPER_ADMIN) {
                router.push("/admin-dashboard");
              } else {
                router.push("/student-dashboard");
              }
            } else {
              router.push("/student-dashboard");
            }
          }
        }
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      
      // Show resend link option for email-related errors
      if (err instanceof Error && (err.message.includes("Email") || err.message.includes("otp"))) {
        setShowResendLink(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        throw new Error(error.message);
      }

      setError(null);
      setShowResendLink(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend email");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
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

      if (error) {
        throw new Error(error.message);
      }

      setError("Password reset email sent. Please check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send password reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <Card className="w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border-white/50 bg-white/40 backdrop-blur-3xl rounded-[3rem] overflow-hidden">

        <CardHeader className="space-y-2 text-center pt-12 pb-8">
          <CardTitle className="text-4xl font-black text-gray-900 tracking-tight">
            {mode === "signup" ? "Create " : "Sign "}
            <span className="text-primary italic">
              {mode === "signup" ? "Account" : "In"}
            </span>
          </CardTitle>
          <CardDescription className="text-base font-medium text-muted-foreground/80">
            {mode === "signup" 
              ? "Join the next generation of AI pioneers." 
              : "Welcome back! Enter your credentials to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          {error && (
            <Alert variant="destructive" className="mb-6 rounded-2xl border-primary/20 bg-primary/5 text-primary">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-bold">Error</AlertTitle>
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}
          
          {showResendLink && (
            <Alert className="mb-6 rounded-2xl border-blue-200 bg-blue-50 text-blue-700">
              <AlertTitle className="font-bold">Verification needed</AlertTitle>
              <AlertDescription className="flex flex-col gap-3 font-medium">
                <p>Please verify your email address to complete registration.</p>
                <Button 
                  variant="outline" 
                  onClick={handleResendEmail}
                  disabled={loading}
                  className="w-fit rounded-xl border-blue-200 hover:bg-blue-100 font-bold"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-bold text-gray-700 ml-1">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={mode === "signup"}
                    placeholder="John Doe"
                    className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-bold text-gray-700 ml-1">Role</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                    <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/20 focus:border-primary transition-all font-medium">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                      <SelectItem value={UserRole.STUDENT} className="rounded-xl font-medium">Student</SelectItem>
                      <SelectItem value={UserRole.INSTRUCTOR} className="rounded-xl font-medium">Instructor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/20 focus:border-primary transition-all font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="password" className="text-sm font-bold text-gray-700">Password</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    className="text-xs font-bold text-primary hover:underline"
                    onClick={handleForgotPassword}
                    disabled={loading}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/20 focus:border-primary transition-all font-medium pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-transparent text-gray-400 hover:text-gray-900"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full h-16 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black text-lg shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-95 border-0 mt-4 group" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loading size="sm" className="border-white/30 border-t-white" />
                  <span>Processing...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {mode === "signup" ? "Get Started" : "Enter Dashboard"}
                  <RotateCcw className="w-5 h-5 opacity-50 group-hover:rotate-180 transition-transform duration-500" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col pb-12">
          <div className="text-sm font-bold text-gray-500">
            {mode === "signup" ? "Already have an account?" : "New to Soliel AI?"}{" "}
            <button 
              className="text-primary hover:underline ml-1"
              onClick={() => router.push(mode === "signup" ? "/sign-in" : "/sign-up")}
            >
              {mode === "signup" ? "Sign In" : "Create Account"}
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}