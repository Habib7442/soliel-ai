import { Navbar } from "@/components/layout/Navbar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="w-full">
        {children}
      </main>
    </>
  );
}