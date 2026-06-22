---
description: Load when working on HappyAniversity — a romantic anniversary React/Three.js web app
applyTo: "**/*.tsx,**/*.ts,**/*.css"
---

# HappyAniversity — Project Instructions

## Project Overview
An interactive 3D anniversary celebration web app built with React, Three.js (@react-three/fiber), Vite, and Tailwind CSS. It shows 12 months of memories as orbiting polaroids around a 3D particle number, controlled by hand gestures (MediaPipe) and keyboard.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **3D**: @react-three/fiber, @react-three/drei, three.js, postprocessing
- **Styling**: Tailwind CSS v3 (utility-first, dark theme: `#0a0010` background)
- **Gesture**: MediaPipe HandLandmarker (WASM model in `/public/models/`)
- **State**: React useState/useRef — no Redux
- **Routing**: Hash-based (`#admin` → AdminPanel)
- **Config storage**: localStorage via `utils/anniversaryConfig.ts`
- **Media storage**: `/public/photos/`, `/public/videos/`, `/public/music/` with `manifest.json`
- **Upload**: Dev-only Vite plugin (`vite-plugin-upload.ts`) at `/api/local-upload`
- **Deploy**: Vercel (vercel.json present)

## Key Files & Roles
| File | Role |
|------|------|
| `App.tsx` | Root: routing, month state, gesture callbacks, media loading |
| `components/AnniversaryScene.tsx` | Three.js scene: lighting, controls, post-processing |
| `components/MediaOrbit.tsx` | Orbiting polaroid items in 3D (OrbitItem + MediaOrbit) |
| `components/MediaModal.tsx` | Full-screen media viewer with prev/next/frame effects |
| `components/AdminPanel.tsx` | Admin UI: login, per-month media upload & config |
| `components/MonthOverlay.tsx` | Month title overlay on the 3D scene |
| `components/GestureController.tsx` | MediaPipe hand tracking → gesture events |
| `utils/anniversaryConfig.ts` | Config read/write to localStorage + media manifest loading |
| `utils/mediaLoader.ts` | Legacy media loader (superseded by anniversaryConfig manifest) |
| `types.ts` | Shared types: SceneState, MonthConfig, AnniversaryConfig, etc. |

## Data Model
```ts
interface AnniversaryConfig {
  coupleNames: string;           // "Nhíp & Quỳnh Anh"
  months: MonthConfig[];         // 12 months
  heartPhotos: string[];         // filenames for heart screen
  heartVideos: string[];
  heartMusic: string | null;
}

interface MonthConfig {
  month: number;                 // 1–12
  title: string;                 // "Tháng 1"
  description: string;
  photos: string[];              // filenames in /public/photos/
  videos: string[];              // filenames in /public/videos/
  music: string | null;          // filename in /public/music/
}
```

## Media File Convention
- Photos → `/public/photos/<filename>` → served at `/photos/<filename>`
- Videos → `/public/videos/<filename>` → served at `/videos/<filename>`
- Music  → `/public/music/<filename>`  → served at `/music/<filename>`
- Each folder has a `manifest.json` listing all filenames
- Upload via `POST /api/local-upload?type=photo|video|music&filename=x` (dev only)
- Delete via `DELETE /api/local-upload?type=photo|video|music&filename=x` (dev only)

## Coding Conventions
- **Language**: TypeScript strict, no `any` unless unavoidable
- **Components**: Functional with hooks; no class components (except ErrorBoundary)
- **Styling**: Tailwind utility classes; custom CSS only for keyframe animations
- **Three.js materials**: Use `meshBasicMaterial` for textured polaroid photos (no lighting dependency); `meshStandardMaterial` for lit solid surfaces
- **Colors** (design system):
  - Background: `#0a0010` (deep space purple)
  - Panel: `#120020` / `#1c0030`
  - Accent: `#D4AF37` (gold), `#FF69B4` (hot pink), `#ff6688` (rose)
  - Text primary: `text-pink-300`, text muted: `text-pink-500`
- **Animations**: Tailwind `animate-*` or CSS `@keyframes` in `<style>` tags

## Admin Panel Guidelines
- Each month tab is self-contained: upload directly for that month (auto-assign)
- Uploaded files go to shared pool (`/public/photos/`), but are immediately assigned to the current month
- To unassign: remove from month (does NOT delete from disk)
- "Add from library" allows assigning existing pool files to a month
- `h-screen overflow-hidden` layout for proper scrolling
- Save button always visible in sticky header

## Scene / 3D Guidelines
- `SceneState.FORMED` = particles/polaroids in position; `SceneState.CHAOS` = scattered
- Month transitions: CHAOS for 1.8 s → change month → FORMED
- `currentMonth === 0` = heart screen (HeartParticles)
- MediaOrbit items use `meshBasicMaterial` for photo textures (not light-dependent)
- Gesture zones in modal: left 25% = prev, right 25% = next, center 50% = close

## Development Commands
```bash
npm run dev      # Vite dev server (upload plugin active)
npm run build    # Production build
npm run preview  # Preview production build
```

## Security Notes
- Admin password is client-side only (sessionStorage) — intentional for a personal project
- Upload endpoint has filename sanitisation (alphanumeric + . - _)
- No user-generated HTML is ever rendered as raw HTML