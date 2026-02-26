import { UnifiedNavbar } from "@/components/layout/UnifiedNavbar";
import { UserRole } from "@/types/enums";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UnifiedNavbar userRole={UserRole.SUPER_ADMIN} isDashboard={true} />
      <main className="w-full pt-28">
        {children}
      </main>
    </>
  );
}