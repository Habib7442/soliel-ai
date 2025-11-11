import { Button } from "@/components/ui/button";

export default function TestPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/20 dark:from-background dark:to-muted/10">
      <div className="w-full max-w-3xl px-4 py-16 mx-auto text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-[#FF6B35] to-[#FF914D] bg-clip-text text-transparent">
          Next.js 16 Test
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your Soliel AI LMS is running on Next.js 16 with React 19!
        </p>
        <div className="mt-8">
          <Button className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D] text-white hover:from-[#FF844B] hover:to-[#FFB088] shadow-lg">
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}