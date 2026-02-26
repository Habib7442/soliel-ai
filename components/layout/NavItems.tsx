"use client";

import { Home, BookOpen, DollarSign, Info, HelpCircle, GraduationCap, Users, FileText, User, Package, Newspaper, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase-client";
import { UserRole } from "@/types/enums";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  role?: UserRole[];
}

export const publicNavItems: NavItem[] = [
  {
    name: "Home",
    href: "/",
    icon: <Home className="h-5 w-5" />,
  },
  {
    name: "About",
    href: "/about",
    icon: <Info className="h-5 w-5" />,
  },
];

// Additional public items that are only shown when not on instructor dashboard
export const additionalPublicNavItems: NavItem[] = [
  {
    name: "Courses",
    href: "/courses",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    name: "Bundles",
    href: "/bundles",
    icon: <Package className="h-5 w-5" />,
  },
  {
    name: "Blog",
    href: "/blog",
    icon: <Newspaper className="h-5 w-5" />,
  },
  {
    name: "FAQ",
    href: "/faq",
    icon: <HelpCircle className="h-5 w-5" />,
  },
];

export const studentNavItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/student-dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
];

export const instructorNavItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/instructor-dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    name: "Earnings",
    href: "/earnings",
    icon: <DollarSign className="h-5 w-5" />,
  },
];

export const companyNavItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/company-dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    name: "Employees",
    href: "/employees",
    icon: <Users className="h-5 w-5" />,
  },
  {
    name: "Assignments",
    href: "/assignments",
    icon: <BookOpen className="h-5 w-5" />,
  },
];

export const adminNavItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/admin-dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    role: [UserRole.SUPER_ADMIN],
  },
  {
    name: "Users",
    href: "/admin-users",
    icon: <Users className="h-5 w-5" />,
    role: [UserRole.SUPER_ADMIN],
  },
  {
    name: "Admin Blog",
    href: "/admin-blog",
    icon: <Newspaper className="h-5 w-5" />,
    role: [UserRole.SUPER_ADMIN],
  },
];

export function NavItems({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const { user, loading } = useSupabase();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const supabase = createClient();
        
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (!error && profile) {
          const newRole = profile.role as UserRole || UserRole.STUDENT;
          setUserRole(newRole);
        } else {
          setUserRole(UserRole.STUDENT);
        }
      } else {
        setUserRole(null);
      }
    };
    
    fetchUserRole();
  }, [user]); // Only re-run when user changes
  
  // Check if we're on the instructor dashboard
  const isInstructorDashboard = pathname === "/instructor-dashboard";
  
  // Memoize filtered navigation items to prevent unnecessary re-renders
  const filteredNavItems = useMemo(() => {
    let items: NavItem[] = [];
    
    
    if (!user) {
      // Public user
      items = [...publicNavItems];
      // Add additional items only when not on instructor dashboard
      if (!isInstructorDashboard) {
        items.push(...additionalPublicNavItems);
      }
    } else if (userRole) {
      // Authenticated user with role loaded
      switch (userRole) {
        case UserRole.SUPER_ADMIN:
          items = [...publicNavItems];
          if (!isInstructorDashboard) {
            items.push(...additionalPublicNavItems);
          }
          items.push(...adminNavItems);
          break;
        case UserRole.STUDENT:
          items = [...publicNavItems];
          if (!isInstructorDashboard) {
            items.push(...additionalPublicNavItems);
          }
          items.push(...studentNavItems);
          break;
        case UserRole.INSTRUCTOR:
          items = [...publicNavItems];
          if (!isInstructorDashboard) {
            items.push(...additionalPublicNavItems);
          }
          items.push(...instructorNavItems);
          break;
        case UserRole.COMPANY_ADMIN:
          items = [...publicNavItems];
          if (!isInstructorDashboard) {
            items.push(...additionalPublicNavItems);
          }
          items.push(...companyNavItems);
          break;
        default:
          items = [...publicNavItems];
          if (!isInstructorDashboard) {
            items.push(...additionalPublicNavItems);
          }
          items.push(...studentNavItems);
      }
    } else {
    }
    // If user exists but role not loaded yet, return empty array (loading)
    
    // Filter items based on role requirements
    return items.filter(item => {
      if (!item.role) return true;
      if (!userRole) return false;
      return item.role.includes(userRole);
    });
  }, [user, userRole, isInstructorDashboard]);
  
  // Memoize loading state
  const loadingElement = useMemo(() => (
    <div className={mobile ? "flex flex-col space-y-4" : "hidden md:flex items-center space-x-8"}>
      Loading...
    </div>
  ), [mobile]);
  
  // Memoize profile link
  const profileLink = useMemo(() => user && (
    <Link
      href="/profile"
      className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
        mobile ? "text-lg py-2" : ""
      } ${
        pathname === "/profile"
          ? "text-primary font-semibold"
          : "text-gray-700 hover:text-primary dark:text-white dark:hover:text-primary"
      }`}
    >
      <User className="h-5 w-5" />
      <span>Profile</span>
    </Link>
  ), [user, pathname, mobile]);
  
  if (loading) {
    return loadingElement;
  }
  
  return (
    <div className={mobile ? "flex flex-col space-y-4" : "hidden md:flex items-center space-x-8"}>
      {filteredNavItems.map((item: NavItem) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
            mobile ? "text-lg py-2" : ""
          } ${
            pathname === item.href
              ? "text-primary font-semibold"
              : "text-gray-700 hover:text-primary dark:text-white dark:hover:text-primary"
          }`}
        >
          {item.icon}
          <span>{item.name}</span>
        </Link>
      ))}
      
      {profileLink}
    </div>
  );
}