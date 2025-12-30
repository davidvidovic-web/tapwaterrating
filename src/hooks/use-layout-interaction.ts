"use client";

import { useState, useEffect } from 'react';

interface LayoutInteractionProps {
  isSearchOpen: boolean;
  isSidebarOpen: boolean;
  searchWidth?: number; // px, estimated width of open search bar
  sidebarWidth?: number; // px, estimated width of open sidebar
  sidebarMargin?: number; // px
}

export function useLayoutInteraction({
  isSearchOpen,
  isSidebarOpen,
  searchWidth = 576, // max-w-xl is 36rem = 576px
  sidebarWidth = 448, // max-w-md is 28rem = 448px (using the larger one for safety)
  sidebarMargin = 16, // right-4 is 1rem = 16px
}: LayoutInteractionProps) {
  const [shouldPushSidebar, setShouldPushSidebar] = useState(false);

  useEffect(() => {
    // Only run on client
    const checkCollision = () => {
      // If either component is not open, no need to push
      if (!isSearchOpen || !isSidebarOpen) {
        setShouldPushSidebar(false);
        return;
      }

      const windowWidth = window.innerWidth;
      
      // Calculate occupied space
      // Search is centered: occupies [center - half, center + half]
      const searchRightEdge = (windowWidth / 2) + (searchWidth / 2);
      
      // Sidebar is right aligned: occupies [width - margin - sidebar, width - margin]
      const sidebarLeftEdge = windowWidth - sidebarMargin - sidebarWidth;
      
      // Check for overlap with some buffer (e.g. 20px)
      const buffer = 20;
      
      if (searchRightEdge + buffer > sidebarLeftEdge) {
        setShouldPushSidebar(true);
      } else {
        setShouldPushSidebar(false);
      }
    };

    // Initial check
    checkCollision();

    // Re-check on resize
    window.addEventListener('resize', checkCollision);
    return () => window.removeEventListener('resize', checkCollision);
  }, [isSearchOpen, isSidebarOpen, searchWidth, sidebarWidth, sidebarMargin]);

  return { shouldPushSidebar };
}
