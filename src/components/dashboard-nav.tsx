"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Building2, Download, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Reviews",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Content",
    href: "/dashboard/content/posts",
    icon: FileText,
  },
  {
    title: "Cities",
    href: "/dashboard/cities",
    icon: Building2,
  },
  {
    title: "Export Logo",
    href: "/dashboard/export-logo",
    icon: Download,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 border-b border-white/20 dark:border-gray-800">
      <div className="flex gap-1 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/dashboard" 
            ? pathname === "/dashboard"
            : pathname === item.href || pathname?.startsWith(item.href + "/");
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                isActive
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
