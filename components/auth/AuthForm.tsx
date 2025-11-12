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
        redirectTo: `${window.location.origin}/reset-password`,
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
    <div className="w-full flex items-center justify-center">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#FF914D] bg-clip-text text-transparent">
            {mode === "signup" ? "Create Account" : "Sign In"}
          </CardTitle>
          <CardDescription>
            {mode === "signup" 
              ? "Enter your information to create your account" 
              : "Enter your credentials to access your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {showResendLink && (
            <Alert className="mb-4">
              <AlertTitle>Email verification needed</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <p>Please verify your email address to complete registration.</p>
                <Button 
                  variant="outline" 
                  onClick={handleResendEmail}
                  disabled={loading}
                  className="w-fit"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={mode === "signup"}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.STUDENT}>Student</SelectItem>
                      <SelectItem value={UserRole.INSTRUCTOR}>Instructor</SelectItem>
                      <SelectItem value={UserRole.COMPANY_ADMIN}>Company Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                {mode === "login" && (
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={handleForgotPassword}
                    disabled={loading}
                  >
                    Forgot Password?
                  </Button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Processing...
                </div>
              ) : mode === "signup" ? "Sign Up" : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto font-medium text-[#FF6B35] hover:text-[#FF914D]"
              onClick={() => router.push(mode === "signup" ? "/sign-in" : "/sign-up")}
            >
              {mode === "signup" ? "Sign In" : "Sign Up"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}