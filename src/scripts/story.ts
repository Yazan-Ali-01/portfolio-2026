import { publishStoryState, subscribeStoryState } from '../lib/story-state';
import { trackOnce } from '../lib/analytics';
import { resolvePosition } from './chapter-position';
import { connectRail } from './rail';

/**
 * Owns every read of scroll position on the page (E04).
 *
 * Publishes `story:state`; never imports the scene. GSAP sits behind a dynamic
 * import so a reader with reduced motion downloads none of it — they still get
 * state published from a plain passive listener, which is all the rail needs.
 */

const REDUCED = '(prefers-reduced-motion: reduce)';

/** Document-space centre of each chapter section. */
function measureAnchors(sections: HTMLElement[]): number[] {
  const scrollTop = window.scrollY;
  return sections.map((section) => {
    const box = section.getBoundingClientRect();
    return box.top + scrollTop + box.height / 2;
  });
}

function readingPosition(): number {
  return window.scrollY + window.innerHeight / 2;
}

/** No GSAP: enough to keep the rail honest, nothing more. */
function bindPlain(sections: HTMLElement[]): void {
  let anchors = measureAnchors(sections);
  const publish = () => publishStoryState(resolvePosition(anchors, readingPosition()));
  const remeasure = () => {
    anchors = measureAnchors(sections);
    publish();
  };

  window.addEventListener('scroll', publish, { passive: true });
  window.addEventListener('resize', remeasure, { passive: true });
  document.fonts?.ready.then(remeasure);
  publish();
}

async function bindScrubbed(sections: HTMLElement[]): Promise<void> {
  const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
  ]);

  gsap.registerPlugin(ScrollTrigger);

  let anchors = measureAnchors(sections);
  const publish = () => publishStoryState(resolvePosition(anchors, readingPosition()));

  ScrollTrigger.create({
    trigger: sections[0],
    start: 'top bottom',
    endTrigger: sections[sections.length - 1],
    end: 'bottom top',
    onUpdate: publish,
    onRefresh: () => {
      anchors = measureAnchors(sections);
      publish();
    },
  });

  // Section offsets move when the layout does. Fonts are the usual culprit:
  // swapping a fallback for Newsreader changes the height of every chapter.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  publish();
}

/**
 * Reading depth, taken from the chapter contract the scene already publishes.
 * Four marks rather than ten, so a full read is four events instead of a stream.
 */
function connectDepth(): void {
  const marks: Record<number, string> = {
    0: 'opened',
    4: 'midway',
    7: 'reached the work',
    9: 'finished',
  };
  subscribeStoryState(({ chapter }) => {
    const mark = marks[chapter];
    if (mark) trackOnce(`story:${chapter}`, 'story_depth', { chapter, mark });
  });
}

function init(): void {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]')).sort(
    (a, b) => Number(a.dataset.chapter) - Number(b.dataset.chapter),
  );

  if (sections.length === 0) return;

  connectRail();
  connectDepth();

  const reduced = window.matchMedia(REDUCED);
  if (reduced.matches) {
    bindPlain(sections);
    return;
  }

  void bindScrubbed(sections);
}

init();
