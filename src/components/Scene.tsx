import { useEffect, useRef, useState } from 'preact/hooks';
import { subscribeStoryState, type StoryState } from '../lib/story-state';
import { FINAL_STATE, keyframes } from '../scene/keyframes';

/**
 * The only client island on the page. Mounted with client:visible, so three.js is
 * not fetched until the stage scrolls into view.
 *
 * It subscribes to `story:state` and never reads scroll position itself — see
 * docs/epics/E03-scene.md.
 */

const isDebug = () =>
  typeof location !== 'undefined' && new URLSearchParams(location.search).get('debug') === 'scene';

export default function Scene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<Awaited<ReturnType<typeof load>> | null>(null);
  const [debug, setDebug] = useState(false);
  const [debugValue, setDebugValue] = useState(0);
  const [size, setCanvasSize] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    // Dynamic import keeps three.js out of the island's synchronous entry, so a
    // slow network delays the scene rather than the hydration of the page.
    load(canvas).then((controller) => {
      if (disposed) {
        controller.dispose();
        return;
      }
      controllerRef.current = controller;

      // NOT canvas.parentElement: Astro wraps islands in <astro-island>, which is
      // `display: contents` and therefore has no box at all. Measuring it yields
      // 0 and the renderer silently draws a 1x1 buffer that CSS then stretches
      // over the whole viewport.
      const host = canvas.closest<HTMLElement>('.stage') ?? canvas;

      const setSize = () => {
        const width = host.clientWidth;
        const height = host.clientHeight;
        if (width < 1 || height < 1) return;
        controller.resize(width, height);
        setCanvasSize([width, height]);
      };
      setSize();

      const resizeObserver = new ResizeObserver(setSize);
      resizeObserver.observe(host);

      // No frames are scheduled while the stage is off-screen.
      const visibility = new IntersectionObserver(
        ([entry]) => controller.setActive(entry.isIntersecting),
        { threshold: 0 },
      );
      visibility.observe(host);

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      let unsubscribe: (() => void) | undefined;

      const applyMotionPreference = () => {
        unsubscribe?.();
        unsubscribe = undefined;
        if (reduced.matches) {
          // One frame, at the composition the story resolves to.
          controller.snapTo(FINAL_STATE);
        } else {
          unsubscribe = subscribeStoryState((state) => controller.setState(state));
        }
      };
      applyMotionPreference();
      reduced.addEventListener('change', applyMotionPreference);

      if (isDebug()) setDebug(true);

      cleanup = () => {
        unsubscribe?.();
        reduced.removeEventListener('change', applyMotionPreference);
        resizeObserver.disconnect();
        visibility.disconnect();
        controller.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup?.();
      controllerRef.current = null;
    };
  }, []);

  /** E03-T5: tune all ten keyframes without scrolling, and before E04 exists. */
  const onDebugInput = (event: Event) => {
    const value = Number((event.target as HTMLInputElement).value);
    setDebugValue(value);
    const scaled = value * (keyframes.length - 1);
    const chapter = Math.min(Math.floor(scaled), keyframes.length - 1);
    controllerRef.current?.setState({
      progress: value,
      chapter,
      chapterProgress: scaled - chapter,
    } satisfies StoryState);
  };

  return (
    <>
      <canvas ref={canvasRef} class="scene__canvas" />
      {debug && (
        <div class="scene__debug">
          <input
            type="range"
            min="0"
            max="1"
            step="0.002"
            value={debugValue}
            onInput={onDebugInput}
            aria-label="Scene progress"
          />
          <span>
            ch {Math.min(Math.floor(debugValue * (keyframes.length - 1)), keyframes.length - 1)}{' '}
            &middot; {debugValue.toFixed(3)} &middot; {size[0]}&times;{size[1]}
          </span>
        </div>
      )}
    </>
  );
}

async function load(canvas: HTMLCanvasElement) {
  const { createSceneController, QUALITY_FULL, QUALITY_COMPACT } = await import(
    '../scene/renderer'
  );
  const compact = window.matchMedia('(max-width: 61.99rem)').matches;
  return createSceneController(canvas, compact ? QUALITY_COMPACT : QUALITY_FULL);
}
