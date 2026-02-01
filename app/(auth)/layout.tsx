import { UnifiedNavbar } from "@/components/layout/UnifiedNavbar";
import { Footer } from "@/components/layout/Footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Persistent Background Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] -z-10" />
      
      <UnifiedNavbar />
      <main className="w-full pt-32 pb-32 relative z-10 flex items-center justify-center min-h-[calc(100vh-64px)]">
        {children}
      </main>
      <Footer />
    </div>
  );
}
