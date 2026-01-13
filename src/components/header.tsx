"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const previousPositionRef = useRef<string>("resources");
  
  // Determine which nav position is active
  const currentPosition = pathname?.startsWith('/blog') ? "blog" : "resources";
  
  useEffect(() => {
    if (navRef.current) {
      const previous = previousPositionRef.current;
      navRef.current.setAttribute('data-nav-prev', previous);
      navRef.current.setAttribute('data-nav-position', currentPosition);
      previousPositionRef.current = currentPosition;
    }
  }, [currentPosition]);
  
  return (
    <>
      {/* Fixed Logo - Top Left */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="transition-opacity hover:opacity-80"
        >
          <Logo />
        </Link>
      </div>

      {/* Fixed Navigation - Top Right */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-4">
        {/* Navigation Links - Glass Pill */}
        <nav 
          ref={navRef}
          className="nav-pills"
          data-nav-position={currentPosition}
          data-nav-prev="resources"
        >
          <Link
            href="/resources"
            className="nav-pills__link"
          >
            <span className="text-sm font-medium">Resources</span>
          </Link>
          <Link
            href="/blog"
            className="nav-pills__link"
          >
            <span className="text-sm font-medium">Blog</span>
          </Link>
        </nav>
        
        <ThemeToggle />
      </div>
    </>
  );
}
