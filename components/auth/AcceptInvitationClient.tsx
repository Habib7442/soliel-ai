"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, Mail, User, Lock } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-client";
import { acceptInvitation } from "@/server/actions/company.actions";
import { Loading } from "@/components/ui/loading";

interface InvitationData {
  id: string;
  company_id: string;
  email: string;
  role: string;
  expires_at: string;
  companies: {
    name: string;
    email: string;
  };
}

interface AcceptInvitationClientProps {
  invitation: InvitationData;
  token: string;
}

import { UnifiedNavbar } from "@/components/layout/UnifiedNavbar";
import { Footer } from "@/components/layout/Footer";
import { RotateCcw } from "lucide-react";

export default function AcceptInvitationClient({ invitation, token }: AcceptInvitationClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (signUpError) {
        toast.error(signUpError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Failed to create account");
        setLoading(false);
        return;
      }

      // Accept the invitation (links user to company)
      const result = await acceptInvitation(token);

      if (!result.success) {
        toast.error(result.error || "Failed to accept invitation");
        setLoading(false);
        return;
      }

      toast.success("Account created successfully! Redirecting...");

      // Redirect based on role
      setTimeout(() => {
        if (invitation.role === "company_admin") {
          router.push("/company-dashboard");
        } else {
          router.push("/student-dashboard");
        }
      }, 1500);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <>
      <UnifiedNavbar />
      <div className="min-h-screen w-full flex items-center justify-center pt-32 pb-32 relative overflow-hidden bg-gray-50/50">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] -z-10" />

        <div className="w-full max-w-xl px-4">
          <Card className="shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border-gray-100 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="space-y-2 text-center pt-12 pb-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-4xl font-black text-gray-900 tracking-tight">
                Company <span className="text-primary italic">Invitation</span>
              </CardTitle>
              <CardDescription className="text-base font-medium text-muted-foreground/80">
                You've been invited to join <span className="text-gray-900 font-bold">{invitation.companies.name}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-12">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email (readonly) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={invitation.email}
                      disabled
                      className="h-14 rounded-2xl border-gray-100 bg-gray-100/50 pl-12 font-medium"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-bold text-gray-700 ml-1">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/20 focus:border-primary transition-all pl-12 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">Create Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/20 focus:border-primary transition-all pl-12 font-medium"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-bold text-gray-700 ml-1">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/20 focus:border-primary transition-all pl-12 font-medium"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {/* Role Badge */}
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <p className="text-sm font-bold text-primary">
                    Role: <span className="text-gray-900 ml-1 font-black">{invitation.role === "company_admin" ? "Company Administrator" : "Employee"}</span>
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black text-lg shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-95 border-0 mt-4 group"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loading size="sm" className="border-white/30 border-t-white" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Accept & Get Started
                      <RotateCcw className="w-5 h-5 opacity-50 group-hover:rotate-180 transition-transform duration-500" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
}
