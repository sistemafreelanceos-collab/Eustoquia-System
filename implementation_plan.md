# Eustaquia System - Phase 1 Implementation Plan

This plan covers the initialization of the Next.js 14 project, integration of React Flow for the visual workspace, and setting up the foundation for persistence with Supabase and Zustand.

## Proposed Changes

### [Component] Project Setup & Structure

Initial environment and folder structure.

#### [NEW] [package.json](file:///c:/Users/omarm/Documents/EUSTAQUIA%20SYSTEM/package.json)
Initialize Next.js project and install:
- `reactflow`
- `zustand`
- `@supabase/supabase-js`
- `@supabase/ssr`
- `lucide-react`
- `clsx`, `tailwind-merge` (standard utils)

#### [NEW] [folder structure]
Create directories for `components/board`, `store`, `hooks`, `lib`, and `types`.

### [Component] Database & State

Foundation for data persistence and global state.

#### [NEW] [supabase.ts](file:///c:/Users/omarm/Documents/EUSTAQUIA%20SYSTEM/lib/supabase.ts)
Supabase client configuration using environment variables.

#### [NEW] [boardStore.ts](file:///c:/Users/omarm/Documents/EUSTAQUIA%20SYSTEM/store/boardStore.ts)
Zustand store to manage:
- Nodes array
- Edges array
- Board metadata (zoom, pan)
- Functions for adding/updating/deleting nodes and edges.

### [Component] Visual Workspace (Canvas)

React Flow implementation.

#### [NEW] [Canvas.tsx](file:///c:/Users/omarm/Documents/EUSTAQUIA%20SYSTEM/components/board/Canvas.tsx)
Main workspace component:
- Full-screen React Flow container.
- Background grid and controls.
- Integration with Zustand store.

#### [NEW] [NodeGroup.tsx](file:///c:/Users/omarm/Documents/EUSTAQUIA%20SYSTEM/components/board/NodeGroup.tsx)
Custom node for "Groups" acting as containers.

#### [NEW] [NodeBasic.tsx](file:///c:/Users/omarm/Documents/EUSTAQUIA%20SYSTEM/components/board/NodeBasic.tsx)
Simple draggable node for content.

## Verification Plan

### Automated Tests
- N/A for Phase 1 (Initial setup focus).

### Manual Verification
- Verify Next.js dev server runs without errors.
- Check that React Flow renders an infinite grid.
- Test dragging and zooming.
- Add nodes via store and verify they appear on the canvas.
- Verify group nodes act as containers (visual test).
