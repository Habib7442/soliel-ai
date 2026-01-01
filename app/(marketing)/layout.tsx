import { UnifiedNavbar } from "@/components/layout/UnifiedNavbar";
import { Footer } from "@/components/layout/Footer";

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
      <Footer />
    </>
  );
}