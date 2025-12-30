import { useRef, useState } from "react";
import { useLayoutManager } from "./use-layout-manager";

/**
 * Example: Using layout manager for search bar and city panel
 * Elements push each other based on priority, not the map
 */
export function ExampleUsage() {
  const searchBarRef = useRef<HTMLDivElement>(null);
  const cityPanelRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const layoutStyles = useLayoutManager({
    elements: [
      {
        ref: searchBarRef,
        priority: 10, // Highest priority - stays put
        anchorTo: "top",
        canMove: false, // Search bar never moves
      },
      {
        ref: cityPanelRef,
        priority: 5, // Medium priority
        visible: isPanelOpen,
        anchorTo: "right", // Prefers right side
      },
      {
        ref: drawerRef,
        priority: 3, // Lower priority - most likely to move
        visible: isDrawerOpen,
        anchorTo: "bottom",
      },
    ],
    gap: 16, // 16px minimum gap between elements
    dependencies: [isPanelOpen, isDrawerOpen], // Recalculate when visibility changes
  });

  return (
    <div className="relative h-screen">
      {/* Search bar - highest priority, never moves */}
      <div
        ref={searchBarRef}
        style={layoutStyles.get(searchBarRef)}
        className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-xl"
      >
        <SearchBar />
      </div>

      {/* City panel - medium priority */}
      {isPanelOpen && (
        <div
          ref={cityPanelRef}
          style={layoutStyles.get(cityPanelRef)}
          className="absolute right-4 top-4 bottom-4 w-96 bg-white rounded-2xl"
        >
          <CityPanel />
        </div>
      )}

      {/* Drawer - lowest priority, moves if needed */}
      {isDrawerOpen && (
        <div
          ref={drawerRef}
          style={layoutStyles.get(drawerRef)}
          className="absolute bottom-0 left-0 right-0 h-32 bg-white"
        >
          <Drawer />
        </div>
      )}

      {/* Map - no styling needed, fills remaining space */}
      <Map />
    </div>
  );
}
