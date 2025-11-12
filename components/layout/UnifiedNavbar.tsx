"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { useSupabase } from "@/providers/supabase-provider";
import { publicNavItems, additionalPublicNavItems, studentNavItems, instructorNavItems, companyNavItems, adminNavItems, NavItem } from "./NavItems";
import { UserRole } from "@/types/enums";
import { useEffect, useState } from "react";
import { SignOut } from "@/components/auth/SignOut";

interface UnifiedNavbarProps {
  userRole?: UserRole | null;
  isInstructorDashboard?: boolean;
}

export function UnifiedNavbar({ userRole = null, isInstructorDashboard = false }: UnifiedNavbarProps) {
  const { user, loading } = useSupabase();

  // Get navigation items based on user role
  const getNavItems = () => {
    let items: NavItem[] = [];
    
    // Always include public items
    items = [...publicNavItems];
    
    // Add additional public items only when not on instructor dashboard
    if (!isInstructorDashboard) {
      items.push(...additionalPublicNavItems);
    }
    
    // Add role-specific items
    if (userRole) {
      switch (userRole) {
        case UserRole.STUDENT:
          items.push(...studentNavItems);
          break;
        case UserRole.INSTRUCTOR:
          items.push(...instructorNavItems);
          break;
        case UserRole.COMPANY_ADMIN:
          items.push(...companyNavItems);
          break;
        case UserRole.SUPER_ADMIN:
          items.push(...adminNavItems);
          break;
        default:
          items.push(...studentNavItems);
      }
    }
    
    // Filter items based on role requirements
    return items.filter(item => {
      if (!item.role) return true;
      if (!userRole) return false;
      return item.role.includes(userRole);
    });
  };

  const navItems = getNavItems();

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
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center space-x-2 text-sm font-medium transition-colors text-gray-700 hover:text-[#FF6B35] dark:text-white dark:hover:text-[#FF914D]"
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
          {user && (
            <Link
              href="/profile"
              className="flex items-center space-x-2 text-sm font-medium transition-colors text-gray-700 hover:text-[#FF6B35] dark:text-white dark:hover:text-[#FF914D]"
            >
              <span>Profile</span>
            </Link>
          )}
        </div>

        {/* Right side items */}
        <div className="flex items-center space-x-2">
          {/* Mode toggle - hidden on mobile */}
          <div className="hidden md:flex">
            <ModeToggle />
          </div>

          {/* Auth buttons - hidden on mobile */}
          <div className="hidden md:flex items-center">
            {loading ? (
              <Button variant="ghost" disabled>Loading...</Button>
            ) : user ? (
              <SignOut>Sign Out</SignOut>
            ) : (
              <Button asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            )}
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
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-2 text-lg py-2 font-medium transition-colors text-gray-700 hover:text-[#FF6B35] dark:text-white dark:hover:text-[#FF914D]"
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  ))}
                  {user && (
                    <Link
                      href="/profile"
                      className="flex items-center space-x-2 text-lg py-2 font-medium transition-colors text-gray-700 hover:text-[#FF6B35] dark:text-white dark:hover:text-[#FF914D]"
                    >
                      <span>Profile</span>
                    </Link>
                  )}
                  <div className="pt-4">
                    {loading ? (
                      <Button variant="ghost" disabled className="w-full">Loading...</Button>
                    ) : user ? (
                      <div className="w-full">
                        <SignOut variant="outline" size="default">Sign Out</SignOut>
                      </div>
                    ) : (
                      <Button asChild className="w-full">
                        <Link href="/sign-in">Sign In</Link>
                      </Button>
                    )}
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