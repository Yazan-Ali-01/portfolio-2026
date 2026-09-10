import type { StoryState } from '../lib/story-state';

/**
 * Pure mapping from scroll position to story state. Kept separate from the GSAP
 * wiring so it can be tested without a DOM (E04-T2).
 *
 * Keyframe i is anchored to the moment section i sits at the centre of the
 * viewport. Between two anchors we interpolate. This is why chapter 0 holds still
 * at the top of the page rather than starting half-way toward chapter 1.
 */
export function resolvePosition(anchors: number[], reading: number): StoryState {
  const last = anchors.length - 1;

  if (last < 0) return { progress: 0, chapter: 0, chapterProgress: 0 };
  if (reading <= anchors[0]) return { progress: 0, chapter: 0, chapterProgress: 0 };
  if (reading >= anchors[last]) return { progress: 1, chapter: last, chapterProgress: 0 };

  let i = 0;
  while (i < last && reading >= anchors[i + 1]) i++;

  const span = anchors[i + 1] - anchors[i];
  const total = anchors[last] - anchors[0];

  return {
    progress: total > 0 ? (reading - anchors[0]) / total : 0,
    chapter: i,
    chapterProgress: span > 0 ? (reading - anchors[i]) / span : 0,
  };
}
