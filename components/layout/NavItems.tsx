"use client";

import { Home, BookOpen, DollarSign, Info, HelpCircle, GraduationCap, Users, FileText, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase-client";
import { UserRole } from "@/types/enums";

interface NavItem {
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
    name: "Pricing",
    href: "/pricing",
    icon: <DollarSign className="h-5 w-5" />,
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
    href: "/student/student-dashboard",
    icon: <Home className="h-5 w-5" />,
  },
  {
    name: "My Courses",
    href: "/learn",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    name: "Certificates",
    href: "/certificates",
    icon: <FileText className="h-5 w-5" />,
  },
];

export const instructorNavItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/instructor-dashboard",
    icon: <Home className="h-5 w-5" />,
  },
  {
    name: "My Courses",
    href: "/instructor/courses",
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    name: "Earnings",
    href: "/instructor/earnings",
    icon: <DollarSign className="h-5 w-5" />,
  },
];

export const companyNavItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/company/company-dashboard",
    icon: <Home className="h-5 w-5" />,
  },
  {
    name: "Employees",
    href: "/company/employees",
    icon: <Users className="h-5 w-5" />,
  },
  {
    name: "Assignments",
    href: "/company/assignments",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    name: "Billing",
    href: "/company/billing",
    icon: <DollarSign className="h-5 w-5" />,
  },
];

export const adminNavItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/admin/admin-dashboard",
    icon: <Home className="h-5 w-5" />,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: <Users className="h-5 w-5" />,
    role: [UserRole.SUPER_ADMIN],
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: <FileText className="h-5 w-5" />,
    role: [UserRole.SUPER_ADMIN],
  },
  {
    name: "Payments",
    href: "/admin/payments",
    icon: <DollarSign className="h-5 w-5" />,
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
        // Use cached role if available
        if (userRole) return;
        
        const supabase = createClient();
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (!error && profile) {
          setUserRole(profile.role as UserRole || UserRole.STUDENT);
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
    } else {
      // Authenticated user
      items = [...publicNavItems];
      
      // Add additional items only when not on instructor dashboard
      if (!isInstructorDashboard) {
        items.push(...additionalPublicNavItems);
      }
      
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
          ? "text-[#FF6B35] font-semibold"
          : "text-gray-700 hover:text-[#FF6B35] dark:text-white dark:hover:text-[#FF914D]"
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
          key={item.name}
          href={item.href}
          className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
            mobile ? "text-lg py-2" : ""
          } ${
            pathname === item.href
              ? "text-[#FF6B35] font-semibold"
              : "text-gray-700 hover:text-[#FF6B35] dark:text-white dark:hover:text-[#FF914D]"
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