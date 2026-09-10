# E03 — The scene

**Goal:** one continuous three.js composition — concentric rings in dark space, a
single warm light at the centre — that renders any point in the story from a state
object. It does not know scroll exists.

**Depends on:** E01. Runs in parallel with E02.

## The state contract

```ts
export type StoryState = {
  progress: number;        // 0-1 across the whole story
  chapter: number;         // 0-9
  chapterProgress: number; // 0-1 within the current chapter
};
```

Delivered as a `story:state` CustomEvent on `window`. The scene subscribes; E04
publishes. Neither imports the other — that is what keeps three.js out of the
eager bundle graph.

## Keyframe table

Derived from the scene directions in `SPEC.md`. Nine rows since §8 was
removed from the story on 2026-09-11. Values are normalised 0-1 and are
a starting point to tune against the real render, not final numbers.

| # | Chapter | Light distance | Light intensity | Ring spread | Ring tilt | Alignment |
|---|---------|---------------|-----------------|-------------|-----------|-----------|
| 0 | Opening | 1.00 (far) | 0.25 | 1.00 (wide) | 0.00 | 0.00 |
| 1 | Aleppo | 1.00 | 0.25 | 0.95 | 0.85 (off-axis) | 0.00 |
| 2 | The room | 0.82 | 0.38 | 0.88 | 0.55 | 0.35 |
| 3 | The message | 0.66 | 0.50 | 0.80 | 0.30 | 0.60 |
| 4 | The ceiling | 0.62 | 0.50 | 1.00 (widens) | 0.30 | 0.60 |
| 5 | Dubai | 0.88 (drops back) | 0.18 (dims) | 0.90 | 0.45 | 0.30 |
| 6 | Back up | 0.48 (past prior) | 0.62 | 0.70 | 0.10 | 0.85 |
| 7 | What they say | 0.28 | 0.78 | 0.48 | 0.02 | 0.98 |
| 8 | Now | 0.15 (front) | 1.00 | 0.40 | 0.00 | 1.00 |

Chapter 5 is the only reversal in the sequence. The spec says to let it hurt — it
should read as a genuine setback, not a dip.

## Tasks

- [x] **E03-T1** — `src/scene/rings.ts`: geometry and material for the concentric
      ring system. Pure three.js, no framework, no DOM assumptions.
- [x] **E03-T2** — `src/scene/keyframes.ts`: the table above as data, plus an
      interpolator resolving a `StoryState` to concrete scene values.
- [x] **E03-T3** — `src/scene/renderer.ts`: scene, camera, renderer setup. DPR
      capped at 2. `setAnimationLoop` paused when the stage is off-screen.
- [x] **E03-T4** — `src/components/Scene.tsx`: the single Preact island. Mounts the
      renderer, subscribes to `story:state`, disposes cleanly on unmount.
      Mounted `client:visible`.
- [x] **E03-T5** — Debug harness: a `?debug=scene` query param rendering a slider
      that publishes `story:state` directly, so the scene is tunable without
      scrolling and before E04 exists.
- [x] **E03-T6** — Reduced-motion path: resolve state for chapter 9, render one
      frame, never start the animation loop.
- [x] **E03-T7** — Colour and light tuning against the E01 palette so the scene and
      the page read as one composition. Starting values: rings `#4A5878` with
      opacity falling 0.62 → 0.28 outward, light core `#FFF2DC`, glow `#F4A94C`,
      `FogExp2` matching the ground. Retuned for the Oxblood palette: rings
      `#B08E9C`, light `#E0736E`, fog `#191016`.

## Build notes

The render loop is not permanent. It runs only while the scene is damping toward
the last state it received, then calls `setAnimationLoop(null)`. An idle scene
schedules zero frames, which is what SPEC.md's "nothing moves on its own" requires
in practice.

Measured cost of the lazy chunk: 519 KB raw, **129 KB gzipped**. Named imports
produce a byte-identical bundle to `import * as THREE` — `WebGLRenderer`
transitively pulls in most of three's core, so this is the floor for any three.js
scene rather than something to optimise away. It is deferred, not eliminated.

## Acceptance

- Dragging the debug slider from 0 to 1 moves through all ten keyframes with no
  discontinuity, and the chapter 5 reversal is visible.
- The scene module graph imports nothing from the scroll code.
- No animation frames are scheduled while the stage is scrolled out of view.
- Unmounting disposes geometries, materials, and the renderer — no context leak on
  hot reload.
- With `prefers-reduced-motion`, exactly one frame renders.

## Out of scope

Anything that reads `scrollY`. Mobile simplification (E06).
