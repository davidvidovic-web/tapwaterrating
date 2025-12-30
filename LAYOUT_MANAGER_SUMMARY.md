# Layout Manager Implementation Summary

## What Changed

Implemented a **Floating UI-inspired priority-based layout manager** for the Tap Water Rating app.

## Key Concept

**Elements push each other, NOT the map**

- Background (map) remains untouched
- UI elements (logo, search, panels) manage themselves with priorities
- Higher priority elements stay fixed, lower priority elements adjust

## Files Created

1. **`/src/hooks/use-layout-manager.ts`** - Main hook implementation
2. **`/src/hooks/use-layout-manager.example.tsx`** - Usage examples
3. **Updated: `/src/hooks/WINDOW_PUSH_README.md`** - Documentation

## Files Modified

**`/src/app/page.tsx`** - Applied layout manager to all UI elements:

```tsx
const logoRef = useRef(null);
const searchBarRef = useRef(null);
const desktopPanelRef = useRef(null);
const mobileDrawerRef = useRef(null);

const layoutStyles = useLayoutManager({
  elements: [
    { ref: logoRef, priority: 8, anchorTo: "bottom", canMove: false },
    { ref: searchBarRef, priority: 10, anchorTo: "top", canMove: false },
    { ref: desktopPanelRef, priority: 6, visible: !!selectedCity },
    { ref: mobileDrawerRef, priority: 5, visible: !!selectedCity },
  ],
  gap: 16,
  dependencies: [selectedCity, searchExpanded, isDrawerExpanded],
});
```

## Priority Hierarchy

Current setup in your app:

| Element | Priority | Behavior |
|---------|----------|----------|
| Search Bar | 10 | **Anchored** - Never moves |
| Logo | 8 | **Anchored** - Never moves |
| Desktop Panel | 6 | May adjust if needed |
| Mobile Drawer | 5 | May adjust if needed |
| Map | N/A | **Background** - Unaffected |

## How It Works

1. **Collision Detection**: Uses `getBoundingClientRect()` for precise overlap detection
2. **Priority Resolution**: Higher priority elements stay put, lower priority elements move
3. **Smart Positioning**: Elements move based on `anchorTo` preference and available space
4. **GPU Acceleration**: Uses `translate3d` transforms for smooth animations
5. **Automatic Z-Index**: Sets `zIndex = priority * 10`

## Benefits

✅ **Map stays static** - No jarring repositioning of background content  
✅ **Predictable behavior** - Priority system makes layout decisions clear  
✅ **Flexible** - Easy to add new UI elements with appropriate priorities  
✅ **Performant** - CSS transforms, no DOM mutations  
✅ **Industry standard** - Based on Floating UI's proven approach  

## Usage

Apply styles to each managed element:

```tsx
<div ref={elementRef} style={layoutStyles.get(elementRef)}>
  <YourComponent />
</div>
```

The map needs no ref or styles - it naturally fills the space.

## Inspired By

**[Floating UI](https://floating-ui.com/)** - Modern positioning library with:
- Middleware system (`shift`, `flip`, `autoPlacement`)
- Priority-based collision resolution
- Element-to-element positioning
- Used by Radix UI, Mantine, Chakra UI, and many others
