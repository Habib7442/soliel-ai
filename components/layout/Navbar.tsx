import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { NavItems } from "./NavItems";
import { ModeToggle } from "@/components/mode-toggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-0">
        {/* Logo on the left */}
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/logo.jpeg"
              alt="Soliel AI Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="font-bold text-xl bg-gradient-to-r from-[#FF6B35] to-[#FF914D] bg-clip-text text-transparent">
              Soliel AI
            </span>
          </Link>
        </div>

        {/* Nav items in the center - hidden on mobile */}
        <div className="hidden md:flex items-center space-x-8">
          <NavItems />
        </div>

        {/* Right side items */}
        <div className="flex items-center space-x-2">
          {/* Mode toggle - hidden on mobile */}
          <div className="hidden md:flex">
            <ModeToggle />
          </div>

          {/* CTA button - hidden on mobile */}
          <div className="hidden md:flex items-center">
            <Button asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center space-x-2">
            <ModeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-white/90 backdrop-blur-md dark:bg-gray-900/90">
                <SheetHeader>
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-8 px-4">
                  <NavItems mobile />
                  <div className="pt-4">
                    <Button asChild className="w-full">
                      <Link href="/sign-in">Sign In</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}