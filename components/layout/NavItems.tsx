"use client";

import { Home, BookOpen, DollarSign, Info, HelpCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export const navItems: NavItem[] = [
  {
    name: "Home",
    href: "/",
    icon: <Home className="h-5 w-5" />,
  },
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
    name: "About",
    href: "/about",
    icon: <Info className="h-5 w-5" />,
  },
  {
    name: "FAQ",
    href: "/faq",
    icon: <HelpCircle className="h-5 w-5" />,
  },
];

export function NavItems({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  
  return (
    <div className={mobile ? "flex flex-col space-y-4" : "hidden md:flex items-center space-x-8"}>
      {navItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
            mobile ? "text-lg py-2" : ""
          } ${
            pathname === item.href
              ? "text-[#FF6B35] font-semibold"
              : "text-gray-700 hover:text-[#FF6B35]"
          }`}
        >
          {item.icon}
          <span>{item.name}</span>
        </Link>
      ))}
    </div>
  );
}