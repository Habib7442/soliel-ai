import { HeroSection } from "@/components/layout/HeroSection";
import { Courses } from "@/components/layout/Courses";
import { PricingSection } from "@/components/layout/PricingSection";
import { EnterpriseSection } from "@/components/layout/EnterpriseSection";
import { FeaturesSection } from "@/components/layout/FeaturesSection";
import { LabsSection } from "@/components/layout/LabsSection";
import { QuizSection } from "@/components/layout/QuizSection";
import { TestimonialsSection } from "@/components/layout/TestimonialsSection";
import { HowItWorksSection } from "@/components/layout/HowItWorksSection";

export default function Home() {
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