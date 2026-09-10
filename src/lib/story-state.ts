/**
 * The contract between the scroll binding (E04) and the scene (E03).
 *
 * This module has no dependencies on purpose. It is the only thing both sides
 * import, so the scroll bundle never pulls three.js into the eager graph.
 */

export type StoryState = {
  /** 0-1 across the whole story. */
  progress: number;
  /** 0-9. */
  chapter: number;
  /** 0-1 within the current chapter. */
  chapterProgress: number;
};

export const STORY_STATE_EVENT = 'story:state';

export function publishStoryState(state: StoryState): void {
  window.dispatchEvent(new CustomEvent<StoryState>(STORY_STATE_EVENT, { detail: state }));
}

export function subscribeStoryState(handler: (state: StoryState) => void): () => void {
  const listener = (event: Event) => handler((event as CustomEvent<StoryState>).detail);
  window.addEventListener(STORY_STATE_EVENT, listener);
  return () => window.removeEventListener(STORY_STATE_EVENT, listener);
}
