import { UnifiedNavbar } from "@/components/layout/UnifiedNavbar";
import { UserRole } from "@/types/enums";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UnifiedNavbar userRole={UserRole.COMPANY_ADMIN} isDashboard={true} />
      <main className="w-full pt-28">
        {children}
      </main>
    </>
  );
}