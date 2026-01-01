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
  const getNavItems = () => {    let items: NavItem[] = [];
    
    console.log('📌 UnifiedNavbar building nav for role:', userRole);
    
    if (!userRole) {
      // Public user (not logged in)
      items = [...publicNavItems];
      if (!isInstructorDashboard) {
        items.push(...additionalPublicNavItems);
      }
      console.log('👤 Public navigation:', items.map(i => i.name));
    } else {
      // Authenticated user with role
      switch (userRole) {
        case UserRole.SUPER_ADMIN:
          // Admin only sees Dashboard and Users (no public items)
          items.push(...adminNavItems);
          console.log('🔧 Super Admin navigation:', items.map(i => i.name));
          break;
        case UserRole.COMPANY_ADMIN:
          // Company admins only see essential navigation (no public items)
          items.push(...companyNavItems);
          console.log('🏢 Company Admin navigation:', items.map(i => i.name));
          break;
        case UserRole.STUDENT:
          // Students see public items + student dashboard
          items = [...publicNavItems];
          if (!isInstructorDashboard) {
            items.push(...additionalPublicNavItems);
          }
          items.push(...studentNavItems);
          console.log('🎓 Student navigation:', items.map(i => i.name));
          break;
        case UserRole.INSTRUCTOR:
          // Instructors see public items + instructor dashboard
          items = [...publicNavItems];
          if (!isInstructorDashboard) {
            items.push(...additionalPublicNavItems);
          }
          items.push(...instructorNavItems);
          console.log('👨‍🏫 Instructor navigation:', items.map(i => i.name));
          break;
        default:
          // Default to student navigation
          items = [...publicNavItems];
          if (!isInstructorDashboard) {
            items.push(...additionalPublicNavItems);
          }
          items.push(...studentNavItems);
          console.log('❓ Default (student) navigation:', items.map(i => i.name));
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
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="Soliel AI Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
          </Link>
        </div>

        {/* Nav items in the center - hidden on mobile */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center space-x-2 text-sm font-medium transition-colors text-gray-700 hover:text-primary dark:text-white dark:hover:text-primary"
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
          {user && (
            <Link
              href="/profile"
              className="flex items-center space-x-2 text-sm font-medium transition-colors text-gray-700 hover:text-primary dark:text-white dark:hover:text-primary"
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
                      className="flex items-center space-x-2 text-lg py-2 font-medium transition-colors text-gray-700 hover:text-primary dark:text-white dark:hover:text-primary"
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  ))}
                  {user && (
                    <Link
                      href="/profile"
                      className="flex items-center space-x-2 text-lg py-2 font-medium transition-colors text-gray-700 hover:text-primary dark:text-white dark:hover:text-primary"
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