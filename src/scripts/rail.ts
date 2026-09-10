import { subscribeStoryState } from '../lib/story-state';

/**
 * Marks each tick past, current or ahead, so the rail reads as progress rather
 * than a static list. A reader three screens in can see how much is left, which
 * is exactly the moment people decide whether to keep going.
 */
export function connectRail(): void {
  const links = Array.from(document.querySelectorAll<HTMLElement>('[data-rail]'));
  if (links.length === 0) return;

  let active = -1;
  subscribeStoryState(({ chapter }) => {
    if (chapter === active) return;
    active = chapter;
    for (const link of links) {
      const index = Number(link.dataset.rail);
      link.dataset.state = index < chapter ? 'past' : index === chapter ? 'current' : 'ahead';
    }
  });
}
