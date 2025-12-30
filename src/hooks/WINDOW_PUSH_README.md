# Layout Manager Hook 🎯

A React hook for priority-based layout management inspired by **Floating UI's middleware system**. Elements push each other based on priority weights rather than pushing background content like maps.

## Overview

The `useLayoutManager` hook manages multiple UI elements with a weight/priority system where:
- **Higher priority elements** stay in place (anchored)
- **Lower priority elements** adjust position to avoid collisions
- **Background elements** (like maps) are unaffected

Perfect for:

Perfect for:
- Search bars staying visible while panels slide in
- Logos remaining fixed while drawers expand
- Navigation elements avoiding overlapping panels
- Complex multi-element layouts with competing space needs

## Inspiration

Based on **[Floating UI](https://floating-ui.com/)** (successor to Popper.js) which uses:
- Priority-based middleware (`shift`, `flip`, `autoPlacement`)
- Element-to-element positioning (not viewport pushing)
- Weight system where higher priority elements anchor
- Collision resolution through middleware ordering

## Installation

The hook is already included in your project at:
- Hook: `src/hooks/use-layout-manager.ts`
- Example: `src/hooks/use-layout-manager.example.tsx`

## Basic Usage

```tsx
import { useRef } from "react";
import { useLayoutManager } from "@/hooks/use-layout-manager";

function MyComponent() {
  const logoRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const layoutStyles = useLayoutManager({
    elements: [
      { ref: logoRef, priority: 8, anchorTo: "bottom", canMove: false },
      { ref: searchRef, priority: 10, anchorTo: "top", canMove: false },
      { ref: panelRef, priority: 6, visible: isPanelOpen, anchorTo: "right" },
    ],
    gap: 16,
    dependencies: [isPanelOpen],
  });

  return (
    <>
      {/* Map stays in background - no styling needed */}
      <Map />
      
      {/* UI elements use layout manager */}
      <div ref={logoRef} style={layoutStyles.get(logoRef)}>
        <Logo />
      </div>
      
      <div ref={searchRef} style={layoutStyles.get(searchRef)}>
        <SearchBar />
      </div>
      
      {isPanelOpen && (
        <div ref={panelRef} style={layoutStyles.get(panelRef)}>
          <Panel />
        </div>
      )}
    </>
  );
}
```

## API Reference

### `useLayoutManager(options)`

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `elements` | `LayoutElement[]` | **required** | Array of elements to manage |
| `gap` | `number` | `16` | Minimum gap between elements (pixels) |
| `enableTransitions` | `boolean` | `true` | Enable smooth CSS transitions |
| `transitionDuration` | `number` | `300` | Transition duration in milliseconds |
| `dependencies` | `unknown[]` | `[]` | Dependencies to trigger recalculation |

#### LayoutElement Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `ref` | `RefObject<HTMLElement>` | **required** | Reference to the DOM element |
| `priority` | `number` | `1` | Weight (higher = stays in place) |
| `visible` | `boolean` | `true` | Whether element is currently visible |
| `canMove` | `boolean` | `true` | Whether element can be repositioned |
| `anchorTo` | `"top" \| "bottom" \| "left" \| "right"` | `undefined` | Preferred anchor direction |

#### Returns

Returns a `Map<RefObject<HTMLElement>, LayoutStyles>` where you can get styles for each element:

```typescript
const styles = layoutStyles.get(elementRef);
// {
//   transform: string;    // translate3d transform
//   transition: string;   // CSS transition
//   willChange: string;   // Performance hint
//   zIndex: number;       // Based on priority
// }
```

## Priority System

The priority/weight system determines which elements stay fixed and which adjust:

```tsx
const pushStyles = useWindowPush({
  targetRef: mapRef,
  overlayRef: panelRef,
  pushDirection: "auto", // Chooses best direction based on available space
  minGap: 20,
  isOverlayVisible: isPanelOpen,
});
```

### Multiple Overlays

Handle multiple panels affecting the same content:

```tsx
import { useMultiWindowPush } from "@/hooks/use-window-push";

const pushStyles = useMultiWindowPush({
  targetRef: contentRef,
  overlays: [
    { ref: leftPanelRef, isVisible: isLeftOpen, priority: 1 },
    { ref: rightPanelRef, isVisible: isRightOpen, priority: 2 },
    { ref: bottomBarRef, isVisible: isBottomOpen, priority: 3 },
  ],
  pushDirection: "auto",
  minGap: 16,
});
```

Higher priority overlays are processed first.

### Responsive Behavior

Different behavior on mobile vs desktop:

```tsx
const [isMobile, setIsMobile] = useState(false);

const pushStyles = useWindowPush({
  targetRef: contentRef,
  overlayRef: panelRef,
  pushDirection: "left",
  isOverlayVisible: isPanelOpen && !isMobile, // Only push on desktop
  dependencies: [isMobile],
});
```

### Custom Transitions

Customize the animation:

```tsx
const pushStyles = useWindowPush({
  targetRef: contentRef,
  overlayRef: panelRef,
  enableTransition: true,
  transitionDuration: 500, // Slower animation
});
```

## Common Patterns

### Map + Info Panel

```tsx
function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const infoPanelRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const pushStyles = useWindowPush({
    targetRef: mapRef,
    overlayRef: infoPanelRef,
    pushDirection: "left",
    isOverlayVisible: !!selectedLocation,
  });

  return (
    <>
      <div ref={mapRef} style={pushStyles} className="map-container">
        <Map onMarkerClick={setSelectedLocation} />
      </div>
      
      {selectedLocation && (
        <div ref={infoPanelRef} className="info-panel">
          <LocationDetails location={selectedLocation} />
        </div>
      )}
    </>
  );
}
```

### Sidebar Navigation

```tsx
function Layout() {
  const mainRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const pushStyles = useWindowPush({
    targetRef: mainRef,
    overlayRef: sidebarRef,
    pushDirection: "right",
    minGap: 0,
    isOverlayVisible: isSidebarOpen,
  });

  return (
    <div className="layout">
      {isSidebarOpen && (
        <aside ref={sidebarRef} className="sidebar">
          <Navigation />
        </aside>
      )}
      
      <main ref={mainRef} style={pushStyles}>
        <Content />
      </main>
    </div>
  );
}
```

### Modal with Tooltip

```tsx
function ModalWithTooltip() {
  const modalRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const pushStyles = useWindowPush({
    targetRef: modalRef,
    overlayRef: tooltipRef,
    pushDirection: "auto",
    minGap: 8,
    isOverlayVisible: showTooltip,
  });

  return (
    <>
      <div ref={modalRef} style={pushStyles} className="modal">
        <button onMouseEnter={() => setShowTooltip(true)}>
          Hover me
        </button>
      </div>
      
      {showTooltip && (
        <div ref={tooltipRef} className="tooltip">
          Helpful information
        </div>
      )}
    </>
  );
}
```

## How It Works

1. **Detection**: Uses `getBoundingClientRect()` to get element positions
2. **Overlap Check**: Determines if elements overlap in viewport
3. **Calculation**: Calculates optimal push distance and direction
4. **Application**: Applies transform via `translate3d` for GPU acceleration
5. **Updates**: Re-calculates on window resize and scroll events

The hook uses `useLayoutEffect` to measure and apply changes before the browser paints, preventing visual flicker.

## Performance

- Uses `translate3d` for GPU-accelerated transforms
- Includes `willChange: transform` hint for browser optimization
- Debounces resize/scroll events
- Only recalculates when dependencies change
- No DOM mutations, only CSS transforms

## Browser Support

Works in all modern browsers that support:
- `getBoundingClientRect()` ✅
- CSS `transform` ✅
- `translate3d()` ✅

## Tips

1. **Always use refs**: Both target and overlay elements need refs
2. **Set dimensions**: Elements should have defined width/height
3. **Position context**: Works best with `fixed` or `absolute` positioned overlays
4. **Dependencies**: Include relevant state in `dependencies` array
5. **Mobile**: Consider disabling push on mobile (overlays instead)
6. **Z-index**: Ensure overlay has higher z-index than target

## Troubleshooting

### Element not pushing

- Verify both refs are attached to DOM elements
- Check that `isOverlayVisible` is `true`
- Ensure elements actually overlap
- Check console for any errors

### Jittery animation

- Increase `transitionDuration`
- Ensure elements have stable dimensions
- Check for conflicting CSS transitions

### Wrong direction

- Try `pushDirection: "auto"`
- Manually specify direction
- Check viewport space in DevTools

### Not updating

- Add changing values to `dependencies` array
- Verify refs update when elements mount/unmount

## Examples

See `src/hooks/use-window-push.example.tsx` for complete working examples including:

1. Basic sidebar push
2. Auto-direction detection
3. Multiple overlays
4. Responsive behavior
5. Map + panel integration

## License

Part of the Tap Water Rating project.

---

## Summary

✅ **Priority-based system** inspired by Floating UI  
✅ **Elements push each other**, not the background  
✅ **Weight/anchor system** for predictable behavior  
✅ **Map stays untouched** - only UI elements manage themselves  
✅ **GPU-accelerated** transforms for smooth performance  

Perfect for complex layouts where multiple UI elements compete for space!
