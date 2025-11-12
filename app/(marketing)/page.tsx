import { HeroSection } from "@/components/layout/HeroSection";
import { Courses } from "@/components/layout/Courses";
import { PricingSection } from "@/components/layout/PricingSection";
import { EnterpriseSection } from "@/components/layout/EnterpriseSection";
import { FeaturesSection } from "@/components/layout/FeaturesSection";
import { LabsSection } from "@/components/layout/LabsSection";
import { QuizSection } from "@/components/layout/QuizSection";
import { TestimonialsSection } from "@/components/layout/TestimonialsSection";
import { HowItWorksSection } from "@/components/layout/HowItWorksSection";
import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { UserRole } from "@/types/enums";

export default async function Home() {
  const supabase = await createServerClient();
  // Use getUser() instead of getSession() for security
  const { data: { user } } = await supabase.auth.getUser();
  
  // If user is logged in, redirect to appropriate dashboard
  if (user) {
    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const userRole = profile?.role || UserRole.STUDENT;
    
    switch (userRole) {
      case UserRole.INSTRUCTOR:
        redirect("/instructor-dashboard");
      case UserRole.COMPANY_ADMIN:
        redirect("/company-dashboard");
      case UserRole.SUPER_ADMIN:
        redirect("/admin-dashboard");
      default:
        redirect("/student-dashboard");
    }
  }
  
  return (
    <div className="w-full">
      <HeroSection />
      <Courses />
      <HowItWorksSection />
      <PricingSection />
      <EnterpriseSection />
      <LabsSection />
      <QuizSection />
      <TestimonialsSection />
      <FeaturesSection />
    </div>
  );
}