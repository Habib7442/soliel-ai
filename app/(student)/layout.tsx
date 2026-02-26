import { UnifiedNavbar } from "@/components/layout/UnifiedNavbar";
import { UserRole } from "@/types/enums";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UnifiedNavbar userRole={UserRole.STUDENT} isDashboard={true} />
      <main className="w-full pt-28">
        {children}
      </main>
    </>
  );
}