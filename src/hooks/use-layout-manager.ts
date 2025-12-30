"use client";

import { useLayoutEffect, useState, RefObject, useCallback, useRef } from "react";

/**
 * Element configuration for layout management
 * Inspired by Floating UI's priority-based middleware system
 * 
 * Higher priority elements stay in place, lower priority elements adjust to avoid them
 */
export interface LayoutElement {
  ref: RefObject<HTMLElement>;
  priority?: number; // Higher = more important (default: 1)
  visible?: boolean; // Is element visible? (default: true)
  canMove?: boolean; // Can this element be repositioned? (default: true)
  anchorTo?: "top" | "bottom" | "left" | "right"; // Preferred direction
}

export interface UseLayoutManagerOptions {
  elements: LayoutElement[];
  gap?: number; // Minimum gap between elements in pixels (default: 16)
  enableTransitions?: boolean; // Smooth CSS transitions (default: true)
  transitionDuration?: number; // Duration in ms (default: 300)
  dependencies?: unknown[]; // Trigger recalculation
}

export interface LayoutStyles {
  transform: string;
  transition: string;
  willChange: string;
  zIndex?: number;
}

export type LayoutResult = Map<RefObject<HTMLElement>, LayoutStyles>;

function detectOverlap(rect1: DOMRect, rect2: DOMRect, gap: number): boolean {
  return !(
    rect1.right + gap < rect2.left ||
    rect1.left > rect2.right + gap ||
    rect1.bottom + gap < rect2.top ||
    rect1.top > rect2.bottom + gap
  );
}

function getAvailableSpace(rect: DOMRect) {
  return {
    top: rect.top,
    bottom: window.innerHeight - rect.bottom,
    left: rect.left,
    right: window.innerWidth - rect.right,
  };
}

function resolveCollisions(
  elements: Array<{ element: LayoutElement; rect: DOMRect }>,
  gap: number
): Map<HTMLElement, { x: number; y: number }> {
  const positions = new Map<HTMLElement, { x: number; y: number }>();
  
  // Sort by priority (highest first)
  const sorted = [...elements].sort(
    (a, b) => (b.element.priority || 1) - (a.element.priority || 1)
  );

  sorted.forEach(({ element }) => {
    if (element.ref.current) {
      positions.set(element.ref.current, { x: 0, y: 0 });
    }
  });

  // Resolve collisions: lower priority elements move to avoid higher priority ones
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (!current.element.canMove || !current.element.ref.current) continue;

    let offsetX = 0;
    let offsetY = 0;

    // Check collisions with higher priority elements
    for (let j = 0; j < i; j++) {
      const other = sorted[j];
      if (!other.element.ref.current) continue;

      if (detectOverlap(current.rect, other.rect, gap)) {
        const space = getAvailableSpace(current.rect);
        
        // Decide direction based on anchor preference and available space
        if (current.element.anchorTo === "left" || 
            (!current.element.anchorTo && space.left > space.right)) {
          offsetX -= other.rect.right - current.rect.left + gap;
        } else if (current.element.anchorTo === "right" ||
                   (!current.element.anchorTo && space.right >= space.left)) {
          offsetX += other.rect.right - current.rect.left + gap;
        }
        
        if (current.element.anchorTo === "top" ||
            (!current.element.anchorTo && space.top > space.bottom)) {
          offsetY -= other.rect.bottom - current.rect.top + gap;
        } else if (current.element.anchorTo === "bottom" ||
                   (!current.element.anchorTo && space.bottom >= space.top)) {
          offsetY += other.rect.bottom - current.rect.top + gap;
        }
      }
    }

    // Clamp to viewport
    const newLeft = current.rect.left + offsetX;
    const newRight = current.rect.right + offsetX;
    const newTop = current.rect.top + offsetY;
    const newBottom = current.rect.bottom + offsetY;

    if (newLeft < gap) offsetX = gap - current.rect.left;
    if (newRight > window.innerWidth - gap) {
      offsetX = window.innerWidth - gap - current.rect.right;
    }
    if (newTop < gap) offsetY = gap - current.rect.top;
    if (newBottom > window.innerHeight - gap) {
      offsetY = window.innerHeight - gap - current.rect.bottom;
    }

    positions.set(current.element.ref.current, { x: offsetX, y: offsetY });
  }

  return positions;
}

/**
 * Priority-based layout manager hook
 * Elements push each other based on priority weights, not the map
 * 
 * @example
 * ```tsx
 * const searchRef = useRef(null);
 * const panelRef = useRef(null);
 * 
 * const layoutStyles = useLayoutManager({
 *   elements: [
 *     { ref: searchRef, priority: 10, anchorTo: "top" }, // Stays in place
 *     { ref: panelRef, priority: 5, visible: isPanelOpen }, // Moves if needed
 *   ],
 *   gap: 16,
 *   dependencies: [isPanelOpen]
 * });
 * 
 * <div ref={searchRef} style={layoutStyles.get(searchRef)} />
 * <div ref={panelRef} style={layoutStyles.get(panelRef)} />
 * ```
 */
export function useLayoutManager({
  elements,
  gap = 16,
  enableTransitions = true,
  transitionDuration = 300,
  dependencies = [],
}: UseLayoutManagerOptions): LayoutResult {
  const [layoutStyles, setLayoutStyles] = useState<LayoutResult>(new Map());

  // Create a stable key for the elements configuration
  const elementsKey = elements.map(el => 
    `${el.priority}-${el.visible}-${el.canMove}-${el.anchorTo}`
  ).join('|');
  
  const depsKey = JSON.stringify(dependencies);

  // Store elements in a ref to avoid dependency issues
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  const updateLayout = useCallback(() => {
    const currentElements = elementsRef.current;
    const visibleElements = currentElements
      .filter(el => el.visible !== false && el.ref.current)
      .map(el => ({
        element: el,
        rect: el.ref.current!.getBoundingClientRect(),
      }));

    if (visibleElements.length === 0) {
      setLayoutStyles(new Map());
      return;
    }

    const positions = resolveCollisions(visibleElements, gap);
    const newStyles = new Map<RefObject<HTMLElement>, LayoutStyles>();
    
    currentElements.forEach(el => {
      if (!el.ref.current) return;
      
      const pos = positions.get(el.ref.current) || { x: 0, y: 0 };
      const priority = el.priority || 1;
      
      newStyles.set(el.ref, {
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0px)`,
        transition: enableTransitions
          ? `transform ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
          : "none",
        willChange: "transform",
        zIndex: priority * 10,
      });
    });

    setLayoutStyles(newStyles);
  }, [elementsKey, gap, enableTransitions, transitionDuration, depsKey]);

  useLayoutEffect(() => {
    updateLayout();

    const handleResize = () => updateLayout();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [updateLayout]);

  return layoutStyles;
}
