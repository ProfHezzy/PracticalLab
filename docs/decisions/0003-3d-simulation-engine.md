# ADR 0003: 3D Simulation Engine (Three.js & React Three Fiber) with 2D Lite Fallback

**Status:** Accepted  
**Date:** 2026-10-28

## Context

The initial MVP delivery plan specified a 2D HTML5 canvas simulation engine using PixiJS. Following updates to the Product Proposal (v1.1) and the Master UI Design Guide (v1.0 §9.8), the product owner approved a decision: **every practical simulation will be real-time 3D, never flat 2D.**

Learners must be able to rotate, zoom, and inspect experiments from any angle in a spatial lab environment, observing physical phenomena (liquid pouring with meniscus and ripples, glowing electric current pulses flowing through wires, rising smoke, heat shimmer, and gas bubbles). The platform must also remain accessible on low-end Android devices and intermittent data connections, with future VR (WebXR) readiness.

## Decisions

1. **Primary Simulation Engine:**
   - Use **Three.js** (WebGL) with **React Three Fiber (`@react-three/fiber`, `@react-three/drei`)** integrated directly into the Next.js React application.
   - Keep simulation state logic (step transitions, action validation, undo/reset, event replay) completely decoupled from the 3D rendering stage so attempts remain deterministic and verifiable.

2. **2D Lite Fallback Mode:**
   - Retain the PixiJS 2D canvas implementation strictly as a **Lite mode fallback**.
   - The Lite fallback is activated automatically when WebGL is unavailable or when the user manually toggles "Data Saver" or "Battery Saver" mode in settings.

3. **Asset & Performance Budgets:**
   - Maximum on-demand 3D simulation bundle size: **<= 4 MB** (using glTF with Draco/Meshopt compression and WebP/KTX2 textures).
   - Reusable apparatus models (beakers, flasks, funnels, bunsen burners, meters, breadboards) shared across experiments and cached in PWA storage for offline use.
   - Render on demand: pause rendering loop when the tab is hidden or the scene is idle; release GPU memory on leaving the lab.

4. **Dynamic Quality Tiers:**
   - **Low:** Under 50,000 triangles, baked soft shadows, simplified glass shaders, <=150 particles, 30 fps target (for entry-level Android devices).
   - **Medium:** Under 120,000 triangles, dynamic shadows, light bloom, <=500 particles, 60 fps target.
   - **High:** Under 250,000 triangles, full effects (heat shimmer, depth of field), <=1,500 particles, 60 fps target (for laptops, tablets, and classroom projectors).
   - Auto-detect device performance on startup with a manual quality override in user preferences.

5. **Sensory Feedback & Accessibility:**
   - Provide multi-sensory feedback: sound effects, haptic vibration (`navigator.vibrate` on supported devices) on snap/pour/heat/mistake events, accompanied by visual twins (teal ring pulses, ripples).
   - Full keyboard navigation and touch alternatives (tap-to-select then tap-target in addition to 3D dragging) for accessibility.
   - Respect `prefers-reduced-motion` by disabling camera shakes and particle shimmer.

6. **WebXR / VR Readiness (Phase 3):**
   - Design all 3D workbench coordinates, scale ratios, and lighting so the scene can be viewed in immersive WebXR headsets or cardboard viewers without restructuring the scene graph.

## Consequences

- Delivers a virtual practical experience that mirrors a physical school laboratory.
- Requires adding `three`, `@types/three`, and `@react-three/fiber` dependencies.
- Re-architects `packages/simulation-engine` and `apps/web/components/simulation-stage` to support 3D scenes while preserving the tested deterministic command/event recording system.
