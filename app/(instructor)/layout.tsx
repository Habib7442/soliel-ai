import { UnifiedNavbar } from "@/components/layout/UnifiedNavbar";
import { UserRole } from "@/types/enums";

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UnifiedNavbar userRole={UserRole.INSTRUCTOR} isInstructorDashboard={true} />
      <main className="w-full pt-16">
        {children}
      </main>
    </>
  );
}