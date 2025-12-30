/**
 * EXAMPLE USAGE of useWindowPush hook
 * 
 * This file demonstrates various ways to use the window pushing functionality
 * in your Next.js components. Copy these patterns into your actual components.
 */

"use client";

import { useRef, useState } from "react";
import { useWindowPush, useMultiWindowPush } from "./use-window-push";

// ============================================================================
// EXAMPLE 1: Basic Usage - Push content when sidebar opens
// ============================================================================

export function BasicExample() {
  const contentRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const pushStyles = useWindowPush({
    targetRef: contentRef,
    overlayRef: sidebarRef,
    pushDirection: "right", // Push content to the right
    minGap: 16, // Maintain 16px gap
    isOverlayVisible: isSidebarOpen,
  });

  return (
    <div className="relative h-screen">
      {/* Main content that gets pushed */}
      <div
        ref={contentRef}
        style={pushStyles}
        className="p-8 bg-gray-100 h-full"
      >
        <h1>Main Content</h1>
        <p>This content will be pushed when the sidebar opens</p>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Toggle Sidebar
        </button>
      </div>

      {/* Sidebar overlay */}
      {isSidebarOpen && (
        <div
          ref={sidebarRef}
          className="fixed left-0 top-0 h-full w-80 bg-white shadow-lg p-6"
        >
          <h2>Sidebar</h2>
          <p>This sidebar pushes the main content</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Auto-direction - Let the hook decide the best direction
// ============================================================================

export function AutoDirectionExample() {
  const mapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const pushStyles = useWindowPush({
    targetRef: mapRef,
    overlayRef: panelRef,
    pushDirection: "auto", // Automatically chooses best direction
    minGap: 20,
    isOverlayVisible: isPanelOpen,
    enableTransition: true,
    transitionDuration: 300,
  });

  return (
    <div className="relative h-screen">
      {/* Map that gets pushed */}
      <div
        ref={mapRef}
        style={pushStyles}
        className="w-full h-full bg-green-100 flex items-center justify-center"
      >
        <div className="text-center">
          <h1>Map View</h1>
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
          >
            Toggle Panel
          </button>
        </div>
      </div>

      {/* Info panel */}
      {isPanelOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-0 left-0 right-0 md:right-auto md:w-96 bg-white shadow-lg p-6 rounded-t-xl md:rounded-r-xl md:rounded-l-none"
        >
          <h2>Info Panel</h2>
          <p>The map automatically adjusts to make room for this panel</p>
          <button
            onClick={() => setIsPanelOpen(false)}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Multiple Overlays - Handle multiple panels affecting same content
// ============================================================================

export function MultipleOverlaysExample() {
  const contentRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [isLeftOpen, setIsLeftOpen] = useState(false);
  const [isRightOpen, setIsRightOpen] = useState(false);

  const pushStyles = useMultiWindowPush({
    targetRef: contentRef,
    overlays: [
      { ref: leftPanelRef, isVisible: isLeftOpen, priority: 1 },
      { ref: rightPanelRef, isVisible: isRightOpen, priority: 2 },
    ],
    pushDirection: "auto",
    minGap: 16,
  });

  return (
    <div className="relative h-screen">
      {/* Content that gets pushed by multiple panels */}
      <div
        ref={contentRef}
        style={pushStyles}
        className="p-8 bg-gray-100 h-full flex items-center justify-center"
      >
        <div className="text-center">
          <h1>Content Area</h1>
          <div className="mt-4 space-x-4">
            <button
              onClick={() => setIsLeftOpen(!isLeftOpen)}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Toggle Left Panel
            </button>
            <button
              onClick={() => setIsRightOpen(!isRightOpen)}
              className="px-4 py-2 bg-purple-500 text-white rounded"
            >
              Toggle Right Panel
            </button>
          </div>
        </div>
      </div>

      {/* Left panel */}
      {isLeftOpen && (
        <div
          ref={leftPanelRef}
          className="fixed left-0 top-0 h-full w-64 bg-blue-50 shadow-lg p-6"
        >
          <h2>Left Panel</h2>
        </div>
      )}

      {/* Right panel */}
      {isRightOpen && (
        <div
          ref={rightPanelRef}
          className="fixed right-0 top-0 h-full w-64 bg-purple-50 shadow-lg p-6"
        >
          <h2>Right Panel</h2>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Responsive Behavior - Different behavior on mobile vs desktop
// ============================================================================

export function ResponsiveExample() {
  const contentRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Only push on desktop, on mobile the panel overlays
  const pushStyles = useWindowPush({
    targetRef: contentRef,
    overlayRef: panelRef,
    pushDirection: "left",
    minGap: 0,
    isOverlayVisible: isPanelOpen && !isMobile,
    enableTransition: true,
    dependencies: [isMobile], // Re-calculate when mobile state changes
  });

  return (
    <div className="relative h-screen">
      <div
        ref={contentRef}
        style={pushStyles}
        className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center"
      >
        <div className="text-center">
          <h1>Responsive Content</h1>
          <p className="mt-2 text-gray-600">
            On desktop: content is pushed
            <br />
            On mobile: panel overlays
          </p>
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
          >
            Toggle Panel
          </button>
        </div>
      </div>

      {isPanelOpen && (
        <div
          ref={panelRef}
          className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-lg p-6"
        >
          <h2>Panel</h2>
          <p>Behavior changes based on screen size</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Integration with your Map + City Panel
// ============================================================================

export function MapPanelExample() {
  const mapRef = useRef<HTMLDivElement>(null);
  const cityPanelRef = useRef<HTMLDivElement>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Push map to make room for city panel
  const pushStyles = useWindowPush({
    targetRef: mapRef,
    overlayRef: cityPanelRef,
    pushDirection: "left", // Push map to the left when panel opens from right
    minGap: 0,
    isOverlayVisible: !!selectedCity,
    enableTransition: true,
    transitionDuration: 400,
  });

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Map container that gets pushed */}
      <div
        ref={mapRef}
        style={pushStyles}
        className="w-full h-full bg-blue-200 flex items-center justify-center"
      >
        <div className="text-center">
          <h1>Map</h1>
          <button
            onClick={() => setSelectedCity("San Francisco")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Select City
          </button>
        </div>
      </div>

      {/* City panel slides in from right */}
      {selectedCity && (
        <div
          ref={cityPanelRef}
          className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl p-8 overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{selectedCity}</h2>
            <button
              onClick={() => setSelectedCity(null)}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
          <div className="space-y-4">
            <p>City information goes here...</p>
            <p>Reviews, ratings, water quality data, etc.</p>
          </div>
        </div>
      )}
    </div>
  );
}
