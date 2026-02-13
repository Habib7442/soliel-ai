"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, ArrowRight } from "lucide-react";

import { useSupabase } from "@/providers/supabase-provider";
import { publicNavItems, additionalPublicNavItems, studentNavItems, instructorNavItems, companyNavItems, adminNavItems, NavItem } from "./NavItems";
import { UserRole } from "@/types/enums";
import { useEffect, useState } from "react";
import { SignOut } from "@/components/auth/SignOut";
import { motion, AnimatePresence } from "framer-motion";

interface UnifiedNavbarProps {
  userRole?: UserRole | null;
  isInstructorDashboard?: boolean;
}

export function UnifiedNavbar({ userRole = null, isInstructorDashboard = false }: UnifiedNavbarProps) {
  const { user, loading } = useSupabase();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getNavItems = () => {
    let items: NavItem[] = [];
    if (!userRole) {
      items = [...publicNavItems];
      if (!isInstructorDashboard) items.push(...additionalPublicNavItems);
    } else {
      switch (userRole) {
        case UserRole.SUPER_ADMIN:
          items = [...publicNavItems];
          if (!isInstructorDashboard) items.push(...additionalPublicNavItems);
          items.push(...adminNavItems);
          break;
        case UserRole.COMPANY_ADMIN:
          items = [...publicNavItems];
          if (!isInstructorDashboard) items.push(...additionalPublicNavItems);
          items.push(...companyNavItems);
          break;
        case UserRole.STUDENT:
          items = [...publicNavItems];
          if (!isInstructorDashboard) items.push(...additionalPublicNavItems);
          items.push(...studentNavItems);
          break;
        case UserRole.INSTRUCTOR:
          items = [...publicNavItems];
          if (!isInstructorDashboard) items.push(...additionalPublicNavItems);
          items.push(...instructorNavItems);
          break;
        default:
          items = [...publicNavItems];
          if (!isInstructorDashboard) items.push(...additionalPublicNavItems);
          items.push(...studentNavItems);
      }
    }
    return items.filter(item => !item.role || (userRole && item.role.includes(userRole)));
  };

  const navItems = getNavItems();

  return (
    <div className="fixed top-0 left-0 right-0 z-[45] px-4 py-4 pointer-events-none">
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`mx-auto max-w-7xl w-full pointer-events-auto transition-all duration-500 rounded-[2rem] border ${
          isScrolled 
            ? "bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] border-white/40 py-3" 
            : "bg-white/50 backdrop-blur-md border-white/20 py-4"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3">
              <Image src="/images/logo.png" alt="Soliel AI" fill className="object-cover" />
            </div>
            <span className="text-xl font-black tracking-tighter text-primary group-hover:text-primary/90 transition-colors">
              Soliel AI <span className="italic">Academy</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-5 py-2 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 transition-all"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">


            {!mounted ? (
              <div className="w-20 h-10" />
            ) : loading && !userRole ? (
              <div className="w-20 h-10 bg-gray-50 animate-pulse rounded-2xl flex items-center justify-center">
                 <div className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : (user || userRole) ? (
              <div className="flex items-center gap-3">
                <Link href="/profile" className="hidden sm:block text-sm font-bold text-gray-500 hover:text-gray-900 px-3 py-2">Account</Link>
                <SignOut 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 font-bold px-4 transition-all"
                >
                  Sign Out
                </SignOut>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/sign-in" className="hidden sm:block px-5 py-2 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all">Sign In</Link>
                <Button asChild size="sm" className="rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold h-10 px-6 shadow-lg shadow-primary/20 border-0">
                  <Link href="/sign-up">Join Free</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden rounded-2xl hover:bg-gray-100">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[400px] rounded-none lg:rounded-l-[3rem] border-l-0 bg-white/95 backdrop-blur-2xl">
                <SheetHeader className="text-left mb-10 pt-4">
                <SheetTitle className="text-2xl font-black text-primary">Soliel AI Academy</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center justify-between p-4 rounded-2xl text-lg font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      <span className="flex items-center gap-3">
                        {item.icon}
                        {item.name}
                      </span>
                      <ArrowRight className="w-5 h-5 opacity-30" />
                    </Link>
                  ))}
                  
                  <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col gap-4">
                    {!user && (
                      <Button asChild size="xl" className="w-full rounded-[1.5rem] bg-primary text-white font-bold">
                        <Link href="/sign-up">Get Started</Link>
                      </Button>
                    )}
                    {user && (
                      <SignOut 
                        variant="ghost" 
                        size="xl" 
                        className="w-full rounded-[1.5rem] bg-red-50 text-red-600 hover:bg-red-100 font-black h-16 transition-all"
                      >
                        Sign Out
                      </SignOut>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.header>
    </div>
  );
}