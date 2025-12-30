"use client";

import { useLayoutEffect, useState, RefObject, useCallback } from "react";

/**
 * Element configuration for layout management
 * Inspired by Floating UI's middleware approach with priority-based positioning
 */
export interface LayoutElement {
  /**
   * Reference to the DOM element
   */
  ref: RefObject<HTMLElement>;
  
  /**
   * Priority/weight of this element (higher = more important, stays in place)
   * Elements with lower priority will be repositioned to avoid higher priority ones
   * @default 1
   */
  priority?: number;
  
  /**
   * Whether this element is currently visible
   * @default true
   */
  visible?: boolean;
  
  /**
   * Whether this element can be repositioned
   * @default true
   */
  canMove?: boolean;
  
  /**
   * Preferred anchor direction when repositioning is needed
   */
  anchorTo?: "viewport" | "top" | "bottom" | "left" | "right";
}

export interface UseLayoutManagerOptions {
  /**
   * Array of elements to manage with their priorities
   */
  elements: LayoutElement[];
  
  /**
   * Minimum gap to maintain between elements (in pixels)
   * @default 16
   */
  gap?: number;
  
  /**
   * Enable smooth CSS transitions
   * @default true
   */
  enableTransitions?: boolean;
  
  /**
   * Transition duration in milliseconds
   * @default 300
   */
  transitionDuration?: number;
  
  /**
   * Dependencies array to trigger recalculation
   */
  dependencies?: unknown[];
}

export interface LayoutStyles {
  transform: string;
  transition: string;
  willChange: string;
  zIndex?: number;
}

export type LayoutResult = Map<RefObject<HTMLElement>, LayoutStyles>;

// Legacy interface for backwards compatibility
export interface WindowPushOptions {
  /**
   * The element that should be pushed when overlapped
   */
  targetRef: RefObject<HTMLElement>;
  
  /**
   * The element that causes the overlap (e.g., a panel, modal, sidebar)
   */
  overlayRef: RefObject<HTMLElement>;
  
  /**
   * Direction to push the target element
   * @default "auto" - automatically determines best direction
   */
  pushDirection?: "top" | "bottom" | "left" | "right" | "auto";
  
  /**
   * Minimum gap to maintain between elements (in pixels)
   * @default 0
   */
  minGap?: number;
  
  /**
   * Whether the overlay is currently visible
   * @default true
   */
  isOverlayVisible?: boolean;
  
  /**
   * Enable smooth transitions when pushing
   * @default true
   */
  enableTransition?: boolean;
  
  /**
   * Transition duration in milliseconds
   * @default 300
   */
  transitionDuration?: number;
  
  /**
   * Dependencies array to trigger recalculation
   */
  dependencies?: unknown[];
}

export interface PushStyles {
  transform: string;
  transition: string;
  willChange: string;
}

/**
 * Detects if two elements overlap in the viewport
 */
function detectOverlap(
  targetRect: DOMRect,
  overlayRect: DOMRect,
  minGap: number = 0
): boolean {
  return !(
    targetRect.right + minGap < overlayRect.left ||
    targetRect.left > overlayRect.right + minGap ||
    targetRect.bottom + minGap < overlayRect.top ||
    targetRect.top > overlayRect.bottom + minGap
  );
}

/**
 * Calculates the optimal push direction and distance
 */
function calculatePushOffset(
  targetRect: DOMRect,
  overlayRect: DOMRect,
  direction: "top" | "bottom" | "left" | "right" | "auto",
  minGap: number = 0
): { x: number; y: number; actualDirection: string } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let x = 0;
  let y = 0;
  let actualDirection = direction;

  // Auto-detect best push direction
  if (direction === "auto") {
    const overlapLeft = Math.max(0, overlayRect.right - targetRect.left);
    const overlapRight = Math.max(0, targetRect.right - overlayRect.left);
    const overlapTop = Math.max(0, overlayRect.bottom - targetRect.top);
    const overlapBottom = Math.max(0, targetRect.bottom - overlayRect.top);

    // Choose direction with most available space
    const availableLeft = targetRect.left;
    const availableRight = viewportWidth - targetRect.right;
    const availableTop = targetRect.top;
    const availableBottom = viewportHeight - targetRect.bottom;

    const maxSpace = Math.max(
      availableLeft,
      availableRight,
      availableTop,
      availableBottom
    );

    if (maxSpace === availableRight && overlapLeft > 0) {
      actualDirection = "right";
    } else if (maxSpace === availableLeft && overlapRight > 0) {
      actualDirection = "left";
    } else if (maxSpace === availableBottom && overlapTop > 0) {
      actualDirection = "bottom";
    } else if (maxSpace === availableTop && overlapBottom > 0) {
      actualDirection = "top";
    }
  }

  // Calculate push offset based on direction
  switch (actualDirection) {
    case "right":
      x = overlayRect.right - targetRect.left + minGap;
      break;
    case "left":
      x = -(targetRect.right - overlayRect.left + minGap);
      break;
    case "bottom":
      y = overlayRect.bottom - targetRect.top + minGap;
      break;
    case "top":
      y = -(targetRect.bottom - overlayRect.top + minGap);
      break;
  }

  // Ensure element stays within viewport
  const newLeft = targetRect.left + x;
  const newRight = targetRect.right + x;
  const newTop = targetRect.top + y;
  const newBottom = targetRect.bottom + y;

  if (newLeft < 0) x = -targetRect.left;
  if (newRight > viewportWidth) x = viewportWidth - targetRect.right;
  if (newTop < 0) y = -targetRect.top;
  if (newBottom > viewportHeight) y = viewportHeight - targetRect.bottom;

  return { x, y, actualDirection };
}

/**
 * Hook to automatically push elements out of the viewport when overlapped by other components
 * 
 * @example
 * ```tsx
 * const targetRef = useRef<HTMLDivElement>(null);
 * const panelRef = useRef<HTMLDivElement>(null);
 * 
 * const pushStyles = useWindowPush({
 *   targetRef,
 *   overlayRef: panelRef,
 *   pushDirection: "left",
 *   minGap: 16,
 *   isOverlayVisible: isPanelOpen,
 *   dependencies: [isPanelOpen, panelWidth]
 * });
 * 
 * return (
 *   <>
 *     <div ref={targetRef} style={pushStyles}>Content to push</div>
 *     <div ref={panelRef}>Overlay panel</div>
 *   </>
 * );
 * ```
 */
export function useWindowPush({
  targetRef,
  overlayRef,
  pushDirection = "auto",
  minGap = 0,
  isOverlayVisible = true,
  enableTransition = true,
  transitionDuration = 300,
  dependencies = [],
}: WindowPushOptions): PushStyles {
  const [pushStyles, setPushStyles] = useState<PushStyles>({
    transform: "translate3d(0px, 0px, 0px)",
    transition: enableTransition
      ? `transform ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
      : "none",
    willChange: "transform",
  });

  const updatePushStyles = useCallback(() => {
    const target = targetRef.current;
    const overlay = overlayRef.current;

    if (!target || !overlay || !isOverlayVisible) {
      // Reset to original position
      setPushStyles({
        transform: "translate3d(0px, 0px, 0px)",
        transition: enableTransition
          ? `transform ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
          : "none",
        willChange: "transform",
      });
      return;
    }

    const targetRect = target.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();

    // Check if elements overlap
    const hasOverlap = detectOverlap(targetRect, overlayRect, minGap);

    if (!hasOverlap) {
      // No overlap, reset position
      setPushStyles({
        transform: "translate3d(0px, 0px, 0px)",
        transition: enableTransition
          ? `transform ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
          : "none",
        willChange: "transform",
      });
      return;
    }

    // Calculate push offset
    const { x, y } = calculatePushOffset(
      targetRect,
      overlayRect,
      pushDirection,
      minGap
    );

    setPushStyles({
      transform: `translate3d(${x}px, ${y}px, 0px)`,
      transition: enableTransition
        ? `transform ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
        : "none",
      willChange: "transform",
    });
  }, [
    targetRef,
    overlayRef,
    pushDirection,
    minGap,
    isOverlayVisible,
    enableTransition,
    transitionDuration,
    ...dependencies,
  ]);

  useLayoutEffect(() => {
    updatePushStyles();

    // Re-calculate on window resize
    const handleResize = () => {
      updatePushStyles();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [updatePushStyles]);

  return pushStyles;
}

/**
 * Hook for managing multiple window push scenarios
 * Useful when you have multiple overlays that might affect the same target
 * 
 * @example
 * ```tsx
 * const targetRef = useRef<HTMLDivElement>(null);
 * const panel1Ref = useRef<HTMLDivElement>(null);
 * const panel2Ref = useRef<HTMLDivElement>(null);
 * 
 * const pushStyles = useMultiWindowPush({
 *   targetRef,
 *   overlays: [
 *     { ref: panel1Ref, isVisible: isPanel1Open },
 *     { ref: panel2Ref, isVisible: isPanel2Open }
 *   ]
 * });
 * ```
 */
export function useMultiWindowPush({
  targetRef,
  overlays,
  pushDirection = "auto",
  minGap = 0,
  enableTransition = true,
  transitionDuration = 300,
}: {
  targetRef: RefObject<HTMLElement>;
  overlays: Array<{
    ref: RefObject<HTMLElement>;
    isVisible?: boolean;
    priority?: number;
  }>;
  pushDirection?: "top" | "bottom" | "left" | "right" | "auto";
  minGap?: number;
  enableTransition?: boolean;
  transitionDuration?: number;
}): PushStyles {
  const [pushStyles, setPushStyles] = useState<PushStyles>({
    transform: "translate3d(0px, 0px, 0px)",
    transition: enableTransition
      ? `transform ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
      : "none",
    willChange: "transform",
  });

  const updatePushStyles = useCallback(() => {
    const target = targetRef.current;
    if (!target) return;

    const targetRect = target.getBoundingClientRect();
    let totalX = 0;
    let totalY = 0;

    // Sort overlays by priority (higher priority first)
    const sortedOverlays = [...overlays]
      .filter((o) => o.isVisible !== false && o.ref.current)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const overlay of sortedOverlays) {
      if (!overlay.ref.current) continue;

      const overlayRect = overlay.ref.current.getBoundingClientRect();
      const hasOverlap = detectOverlap(targetRect, overlayRect, minGap);

      if (hasOverlap) {
        const { x, y } = calculatePushOffset(
          targetRect,
          overlayRect,
          pushDirection,
          minGap
        );
        totalX += x;
        totalY += y;
      }
    }

    setPushStyles({
      transform: `translate3d(${totalX}px, ${totalY}px, 0px)`,
      transition: enableTransition
        ? `transform ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
        : "none",
      willChange: "transform",
    });
  }, [targetRef, overlays, pushDirection, minGap, enableTransition, transitionDuration]);

  useLayoutEffect(() => {
    updatePushStyles();

    const handleResize = () => {
      updatePushStyles();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [updatePushStyles]);

  return pushStyles;
}
