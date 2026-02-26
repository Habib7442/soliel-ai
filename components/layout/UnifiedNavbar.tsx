"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, ArrowRight, User } from "lucide-react";

import { useSupabase } from "@/providers/supabase-provider";
import { publicNavItems, additionalPublicNavItems, studentNavItems, instructorNavItems, companyNavItems, adminNavItems, NavItem } from "./NavItems";
import { UserRole } from "@/types/enums";
import { useEffect, useState } from "react";
import { SignOut } from "@/components/auth/SignOut";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

interface UnifiedNavbarProps {
  userRole?: UserRole | null;
  isDashboard?: boolean;
}

export function UnifiedNavbar({ 
  userRole: userRoleProp = null, 
  isDashboard = false
}: UnifiedNavbarProps) {
  const { user, loading } = useSupabase();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [fetchedRole, setFetchedRole] = useState<UserRole | null>(null);

  // If prop is provided, use it; otherwise, use the fetched role
  const userRole = userRoleProp ?? fetchedRole;

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch user role from DB when no prop is provided
  useEffect(() => {
    let cancelled = false;
    const fetchUserRole = async () => {
      if (userRoleProp) return; // Prop was provided, no need to fetch
      if (!user) {
        setFetchedRole(null);
        return;
      }
      try {
        const { createClient } = await import("@/lib/supabase-client");
        const supabase = createClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile && !cancelled) {
          const role = Object.values(UserRole).includes(profile.role as UserRole)
            ? (profile.role as UserRole)
            : null;
          setFetchedRole(role);
        }
      } catch {
        // silently fail — public nav will be shown
      }
    };
    fetchUserRole();
    return () => { cancelled = true; };
  }, [user, userRoleProp]);

  const getNavItems = () => {
    let items: NavItem[] = [];
    
    // If we are in an admin/instructor/student dashboard, we show a highly focused menu
    if (isDashboard) {
      let dashboardItems: NavItem[] = [];
      if (userRole === UserRole.SUPER_ADMIN) dashboardItems = [...adminNavItems];
      else if (userRole === UserRole.INSTRUCTOR) dashboardItems = [...instructorNavItems];
      else if (userRole === UserRole.COMPANY_ADMIN) dashboardItems = [...companyNavItems];
      else dashboardItems = [...studentNavItems];

      // Add Home link at the beginning
      return [publicNavItems[0], ...dashboardItems];
    }

    if (!userRole) {
      items = [...publicNavItems, ...additionalPublicNavItems];
    } else {
      // For general pages (Home, About, etc.) while logged in
      // Show ONLY public items in the center, dashboard goes to the right actions
      items = [...publicNavItems, ...additionalPublicNavItems];
    }
    
    // Limit main nav items to prevent clutter, others can go in "More" if we had it
    // For now, let's just returning the filtered list
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
        <div className="container mx-auto flex items-center justify-between px-6 lg:px-8 relative">
          {/* Logo Group */}
          <div className="flex-1 flex items-center">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="relative w-12 h-12 transition-transform group-hover:scale-110">
                <Image 
                  src="/images/v2-logo.png" 
                  alt="Soliel AI" 
                  fill 
                  className="object-contain" 
                  priority
                />
              </div>
              <div className="flex flex-col leading-[0.85]">
                <span className="text-xl font-black tracking-tighter text-primary group-hover:text-primary/90 transition-colors">
                  Soliel AI
                </span>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary/60 ml-0.5">
                  Academy
                </span>
              </div>
            </Link>
          </div>

          {/* Center Nav - Absolute Centered */}
          <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    isActive 
                      ? "text-primary bg-primary/5" 
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/80"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions Group */}
          <div className="flex-1 flex items-center justify-end gap-3">



            {!mounted ? (
              <div className="w-20 h-10" />
            ) : loading && !userRole ? (
              <div className="w-20 h-10 bg-gray-50 animate-pulse rounded-2xl flex items-center justify-center">
                 <div className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : (user || userRole) ? (
              <div className="flex items-center gap-2">
                {(() => {
                  let dashHref = "/student-dashboard";
                  let dashName = "Dashboard";
                  
                  if (userRole === UserRole.SUPER_ADMIN) { dashHref = "/admin-dashboard"; dashName = "Admin Dashboard"; }
                  else if (userRole === UserRole.INSTRUCTOR) { dashHref = "/instructor-dashboard"; dashName = "Instructor Dashboard"; }
                  else if (userRole === UserRole.COMPANY_ADMIN) { dashHref = "/company-dashboard"; dashName = "Company Dashboard"; }
                  else { dashHref = "/student-dashboard"; dashName = "Student Dashboard"; }

                  return (
                    <Link 
                      href={dashHref}
                      className={`hidden sm:flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all ${
                        pathname === dashHref 
                          ? "text-primary bg-primary/5 shadow-sm" 
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                       <LayoutDashboard className="w-4 h-4" />
                       <span className="hidden xl:inline">{dashName}</span>
                    </Link>
                  );
                })()}
                <SignOut 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50/50 font-bold px-4 transition-all h-9"
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
                      key={item.href}
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