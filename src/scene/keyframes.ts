import type { StoryState } from '../lib/story-state';

/**
 * One keyframe per chapter, derived from the scene directions in SPEC.md.
 * See docs/epics/E03-scene.md for the table in readable form.
 *
 * All values are normalised 0-1. The renderer maps them to world units, so these
 * can be tuned against the render without touching the scene code.
 */
export type SceneValues = {
  /** 1 = far from the viewer, 0 = at the front. */
  lightDistance: number;
  lightIntensity: number;
  /** 1 = rings wide, 0 = drawn in. */
  ringSpread: number;
  /** 1 = fully off-axis, 0 = level. */
  ringTilt: number;
  /** 0 = rings scattered off centre, 1 = truly concentric. */
  alignment: number;
};

export const keyframes: SceneValues[] = [
  // 0 — Opening. Light distant, rings wide and cold.
  { lightDistance: 1.0, lightIntensity: 0.25, ringSpread: 1.0, ringTilt: 0.0, alignment: 0.0 },
  // 1 — Aleppo. Rings tilt off-axis. Light unchanged.
  { lightDistance: 1.0, lightIntensity: 0.25, ringSpread: 0.95, ringTilt: 0.85, alignment: 0.0 },
  // 2 — The room. Rings begin to align. Light takes its first step closer.
  { lightDistance: 0.82, lightIntensity: 0.38, ringSpread: 0.88, ringTilt: 0.55, alignment: 0.35 },
  // 3 — The message. Light closer. Rings hold steady for the first time.
  { lightDistance: 0.66, lightIntensity: 0.5, ringSpread: 0.8, ringTilt: 0.3, alignment: 0.6 },
  // 4 — The ceiling. Rings widen; the space opens up before the move.
  { lightDistance: 0.62, lightIntensity: 0.5, ringSpread: 1.0, ringTilt: 0.3, alignment: 0.6 },
  // 5 — Dubai. The one reversal in the sequence. Light drops back and dims.
  { lightDistance: 0.88, lightIntensity: 0.18, ringSpread: 0.9, ringTilt: 0.45, alignment: 0.3 },
  // 6 — Back up. Light recovers past its previous position. Rings level out.
  { lightDistance: 0.48, lightIntensity: 0.62, ringSpread: 0.7, ringTilt: 0.1, alignment: 0.85 },
  // 7 — What they say. Still. Let the quotes hold the page.
  { lightDistance: 0.28, lightIntensity: 0.78, ringSpread: 0.48, ringTilt: 0.02, alignment: 0.98 },
  // 8 — Now. Light at the front, steady. Rings level. Motion stops.
  { lightDistance: 0.15, lightIntensity: 1.0, ringSpread: 0.4, ringTilt: 0.0, alignment: 1.0 },
];

export const FINAL_STATE: StoryState = {
  progress: 1,
  chapter: keyframes.length - 1,
  chapterProgress: 0,
};

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Smoothstep, so a chapter settles into place rather than arriving linearly. */
const ease = (t: number) => t * t * (3 - 2 * t);

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Resolves a story state to concrete scene values.
 *
 * Interpolation is chapter-based rather than driven by global progress, because
 * chapters differ in height — a chapter that scrolls for three screens should
 * still take exactly one keyframe step.
 */
export function resolveScene(state: StoryState): SceneValues {
  const last = keyframes.length - 1;
  const from = Math.min(Math.max(Math.floor(state.chapter), 0), last);
  const to = Math.min(from + 1, last);
  const t = ease(clamp01(state.chapterProgress));
  const a = keyframes[from];
  const b = keyframes[to];

  return {
    lightDistance: mix(a.lightDistance, b.lightDistance, t),
    lightIntensity: mix(a.lightIntensity, b.lightIntensity, t),
    ringSpread: mix(a.ringSpread, b.ringSpread, t),
    ringTilt: mix(a.ringTilt, b.ringTilt, t),
    alignment: mix(a.alignment, b.alignment, t),
  };
}
