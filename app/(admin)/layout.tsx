import { UnifiedNavbar } from "@/components/layout/UnifiedNavbar";
import { UserRole } from "@/types/enums";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UnifiedNavbar userRole={UserRole.SUPER_ADMIN} />
      <main className="w-full pt-16">
        {children}
      </main>
    </>
  );
}