import { subscribeStoryState } from '../lib/story-state';

/** Lights the tick for the chapter currently being read. */
export function connectRail(): void {
  const links = Array.from(document.querySelectorAll<HTMLElement>('[data-rail]'));
  if (links.length === 0) return;

  let active = -1;
  subscribeStoryState(({ chapter }) => {
    if (chapter === active) return;
    active = chapter;
    for (const link of links) {
      link.dataset.active = String(Number(link.dataset.rail) === chapter);
    }
  });
}
