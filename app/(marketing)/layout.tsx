import { UnifiedNavbar } from "@/components/layout/UnifiedNavbar";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UnifiedNavbar />
      <main className="w-full pt-16">
        {children}
      </main>
    </>
  );
}