import { Navbar } from "@/components/layout/Navbar";

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* <Navbar /> */}
      <main className="w-full pt-16">
        {children}
      </main>
    </>
  );
}