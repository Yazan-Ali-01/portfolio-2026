import { useEffect, useRef, useState } from 'preact/hooks';
import type { ArtifactSpec, DeskNoteSpec, HoverAnchor, Shot } from '../scene/studio';
import { track, trackOnce } from '../lib/analytics';

/**
 * The studio island (E10). One `client:visible` component; three.js arrives
 * behind a dynamic import so it is never on the critical path.
 *
 * The canvas is decorative and `aria-hidden`. The project list underneath it on
 * /work is the real navigation, and it is never removed — keyboard and no-JS
 * readers reach every project through it.
 */

interface Props {
  artifacts: ArtifactSpec[];
  notes: DeskNoteSpec[];
}

type Hover = { kind: 'project' | 'note'; name: string; body?: string } | null;

export default function Studio({ artifacts, notes }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef<HTMLDivElement>(null);
  /** Set by the effect once the scene exists, so the caption buttons can drive it. */
  const goRef = useRef<((by: number) => void) | null>(null);
  const stepShot = (by: number) => goRef.current?.(by);
  const [hover, setHover] = useState<Hover>(null);
  const [ready, setReady] = useState(false);
  const [keys, setKeys] = useState(false);
  /** Portrait showroom: the shot list and which one is framed. Null on wide viewports. */
  const [room, setRoom] = useState<{ shots: Shot[]; at: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Reduced motion simplifies the room, it does not delete it. The scene is
    // built and stays clickable; the camera stops drifting. See `still` below.
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    import('../scene/studio').then(({ createStudio }) => {
      if (disposed) return;
      const host = canvas.closest<HTMLElement>('.studio') ?? canvas;
      const compact = window.matchMedia('(max-width: 61.99rem)').matches;

      // The name follows the artifact. Position is written straight to the node
      // every frame — routing it through state would re-render at 60fps for a
      // value that only ever moves a transform.
      // Touch never hovers, so on a touch device the card is driven by taps and
      // the hover stream is ignored entirely. Otherwise a tapped note would be
      // wiped by the very next frame reporting "nothing hovered".
      const touch = !window.matchMedia('(hover: hover)').matches;

      let shown = '';
      const place = (anchor: HoverAnchor) => {
        const node = labelRef.current;
        if (!node || !anchor) return;
        const pad = 14;
        const halfW = node.offsetWidth / 2;
        const nav = document.querySelector('.studio__nav');
        const guard = nav
          ? nav.getBoundingClientRect().bottom - host.getBoundingClientRect().top
          : 0;
        const x = Math.min(
          Math.max(anchor.x, halfW + pad),
          Math.max(halfW + pad, host.clientWidth - halfW - pad),
        );
        const y = Math.max(anchor.y, node.offsetHeight + Math.max(pad, guard + pad));
        node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;
      };

      const show = (anchor: HoverAnchor) => {
        const key = anchor ? `${anchor.kind}:${anchor.name}` : '';
        if (key !== shown) {
          shown = key;
          setHover(
            anchor
              ? {
                  kind: anchor.kind,
                  name: anchor.name,
                  body: anchor.kind === 'note' ? anchor.body : undefined,
                }
              : null,
          );
          host.style.cursor = anchor?.kind === 'project' ? 'pointer' : '';
        }
        // Position after the state lands, so the card has been measured.
        requestAnimationFrame(() => place(anchor));
        place(anchor);
      };

      const onHover = (anchor: HoverAnchor) => {
        if (touch) return;
        if (anchor) {
          trackOnce('studio:used', 'studio_used');
          if (anchor.kind === 'note') {
            trackOnce(`note:${anchor.name}`, 'note_open', { note: anchor.name });
          }
        }
        show(anchor);
      };

      const studio = createStudio(canvas, artifacts, { compact, notes, onHover, still });
      setReady(true);

      /*
       * The portrait showroom. A landscape room in a portrait window shrinks
       * until the screenshots, which are the point, are unreadable. On compact
       * viewports the camera frames one at a time and the reader swipes along
       * the desk.
       */
      const shots = compact ? studio.shots() : [];
      let shotAt = 0;
      if (compact) setRoom({ shots, at: 0 });

      const goTo = (i: number) => {
        const n = shots.length;
        shotAt = n ? ((i % n) + n) % n : 0;
        studio.goTo(shotAt);
        setRoom({ shots, at: shotAt });
        trackOnce('studio:used', 'studio_used');
      };
      goRef.current = (by: number) => goTo(shotAt + by);

      const setSize = () => {
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (w > 0 && h > 0) studio.resize(w, h);
      };
      setSize();

      const ro = new ResizeObserver(setSize);
      ro.observe(host);

      const io = new IntersectionObserver(
        ([e]) => {
          inView = e.isIntersecting;
          studio.setActive(e.isIntersecting);
        },
        { threshold: 0 },
      );
      io.observe(host);

      const toNdc = (event: { clientX: number; clientY: number }) => {
        const box = host.getBoundingClientRect();
        return [
          ((event.clientX - box.left) / box.width) * 2 - 1,
          -(((event.clientY - box.top) / box.height) * 2 - 1),
        ] as const;
      };

      const onMove = (event: PointerEvent) => {
        const [nx, ny] = toNdc(event);
        studio.setPointer(nx, ny);
        studio.setDrag(nx, ny);
      };

      /*
       * Swipe, on compact only. Horizontal past the threshold moves a shot;
       * anything more vertical is left alone so the page still scrolls, which
       * is also why the stage sets `touch-action: pan-y`.
       */
      let downX = 0;
      let downY = 0;
      let tracking = false;
      let swiped = false;

      const onDown = (event: PointerEvent) => {
        downX = event.clientX;
        downY = event.clientY;
        tracking = true;
        swiped = false;
      };

      const onUp = (event: PointerEvent) => {
        if (!tracking) return;
        tracking = false;
        const dx = event.clientX - downX;
        const dy = event.clientY - downY;
        if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;
        swiped = true;
        // Swipe left, camera moves right along the desk, like dragging the room.
        goTo(shotAt + (dx < 0 ? 1 : -1));
      };

      const onLeave = () => {
        studio.setPointer(-2, -2);
        studio.setDrag(0, 0);
      };

      const onClick = (event: MouseEvent) => {
        if (swiped) {
          swiped = false;
          return;
        }
        /*
         * The caption sits inside the stage, so its clicks bubble here. Without
         * this, tapping "next" also counted as a tap on the room and the pick
         * fell through to whatever monitor was nearest, navigating away.
         */
        if ((event.target as HTMLElement | null)?.closest('.studio__shot')) return;
        // Resolve where the click actually landed. Relying on hover state meant
        // taps never opened anything, because touch never hovers.
        const [nx, ny] = toNdc(event);
        const found = studio.probeAt(nx, ny);
        if (found && 'project' in found) {
          track('artifact_open', { project: found.project });
          window.location.href = `/work/${found.project}`;
          return;
        }
        // A note, or nothing. On touch a tap is the only way to open a note, and
        // tapping empty space dismisses whatever is open.
        if (found) {
          trackOnce('studio:used', 'studio_used');
          trackOnce(`note:${found.name}`, 'note_open', { note: found.name });
        }
        show(found);
      };

      /*
       * The keyboard path into the room (E10-T4).
       *
       * The first version demanded five invisible tab stops before it answered
       * anything, which meant the obvious move — land on the page and press an
       * arrow — did nothing at all. So the room claims the horizontal arrows
       * outright whenever it is on screen. Nothing else on this page uses them:
       * there is no sideways scroll to take away.
       *
       * The vertical arrows are a different matter. Those scroll the page, and
       * the room only takes them once it has been focused on purpose.
       *
       * The project index under the canvas is still the route that matters for
       * assistive tech, and it is never removed.
       */
      const stops = studio.targets();
      const keyHost = keysRef.current;
      let at = -1;
      let inView = false;

      const step = (by: number) => {
        at = (at + by + stops.length) % stops.length;
        setKeys(true);
        show(studio.focus(at));
      };

      const leave = () => {
        studio.blur();
        show(null);
        at = -1;
        setKeys(false);
      };

      const onKey = (event: KeyboardEvent) => {
        if (!inView) return;

        const el = document.activeElement;
        const roomFocused = el === keyHost;
        // Only when the reader is not operating something else: a link they
        // tabbed to, or a field they are typing in.
        const idle = roomFocused || el === null || el === document.body;

        switch (event.key) {
          case 'ArrowRight':
          case 'ArrowLeft': {
            if (!idle) return;
            event.preventDefault();
            const by = event.key === 'ArrowRight' ? 1 : -1;
            if (compact) goTo(shotAt + by);
            else step(by);
            break;
          }

          case 'ArrowDown':
          case 'ArrowUp':
            if (!roomFocused) return;
            event.preventDefault();
            step(event.key === 'ArrowDown' ? 1 : -1);
            break;

          case 'Enter':
          case ' ': {
            // Space scrolls. Claim it only when there is something to open.
            if (!idle || at < 0) return;
            event.preventDefault();
            const stop = stops[at];
            if (stop.kind === 'project' && stop.project) {
              track('artifact_open', { project: stop.project });
              window.location.href = `/work/${stop.project}`;
            }
            break;
          }

          case 'Escape':
            if (at < 0) return;
            leave();
            keyHost?.blur();
            break;

          default:
            return;
        }
        trackOnce('studio:used', 'studio_used');
      };

      const onFocus = () => {
        setKeys(true);
        if (at < 0) step(1);
      };

      const onBlur = () => leave();

      // On window, not on the element: the arrows have to answer before
      // anything has been focused, which is the whole point.
      window.addEventListener('keydown', onKey);
      keyHost?.addEventListener('focus', onFocus);
      keyHost?.addEventListener('blur', onBlur);

      host.addEventListener('pointermove', onMove);
      host.addEventListener('pointerleave', onLeave);
      host.addEventListener('click', onClick);
      if (compact) {
        host.addEventListener('pointerdown', onDown);
        host.addEventListener('pointerup', onUp);
        host.addEventListener('pointercancel', () => (tracking = false));
      }

      cleanup = () => {
        window.removeEventListener('keydown', onKey);
        keyHost?.removeEventListener('focus', onFocus);
        keyHost?.removeEventListener('blur', onBlur);
        host.removeEventListener('pointerdown', onDown);
        host.removeEventListener('pointerup', onUp);
        host.removeEventListener('pointermove', onMove);
        host.removeEventListener('pointerleave', onLeave);
        host.removeEventListener('click', onClick);
        ro.disconnect();
        io.disconnect();
        studio.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} class="studio__canvas" aria-hidden="true" data-lit={ready ? "" : undefined} />

      {/*
        Focusable, but transparent to the pointer, so a mouse never touches it
        and the room reads exactly as before. It carries a real label rather
        than aria-hidden: a focusable node that is hidden from assistive tech
        drops a screen reader somewhere that announces nothing.
      */}
      <div
        ref={keysRef}
        class="studio__keys"
        tabIndex={ready ? 0 : -1}
        role="group"
        aria-label="The desk in 3D. Arrow keys move between the things on it, Enter opens a project. Every project is also in the list below."
        hidden={!ready}
      />

      {/*
        The showroom caption. A real link, not a 3D tap target: on a phone this
        is how the case study gets opened, and it should not depend on hitting
        a monitor with a thumb.
      */}
      {room && (
        <div class="studio__shot">
          {/*
            Buttons, not just a swipe. The gesture was there before this and
            nobody could tell: a swipe leaves no mark on the page. These say
            there are three of them and that you can move, and they give a tap
            target to anyone who would never think to swipe.
          */}
          <div class="studio__rail">
            <button
              type="button"
              class="studio__step"
              aria-label="Previous project"
              onClick={() => stepShot(-1)}
            >
              <span aria-hidden="true">‹</span>
            </button>

            <div class="studio__dots" aria-hidden="true">
              {room.shots.map((s, i) => (
                <span class={i === room.at ? 'is-on' : ''} />
              ))}
            </div>

            <p class="studio__count">
              {room.at + 1} of {room.shots.length}
            </p>

            <button
              type="button"
              class="studio__step"
              aria-label="Next project"
              onClick={() => stepShot(1)}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <p class="studio__shotname">{room.shots[room.at]?.name}</p>
          {room.shots[room.at]?.status && (
            <p class="studio__shotmeta">{room.shots[room.at].status}</p>
          )}
          <a
            class="studio__shotcta"
            href={`/work/${room.shots[room.at]?.id}`}
            data-ev="artifact_open"
            data-ev-project={room.shots[room.at]?.id}
          >
            Open the case study
          </a>
        </div>
      )}

      <p class="studio__legend" hidden={!keys} aria-hidden="true">
        <span><kbd>←</kbd><kbd>→</kbd> move</span>
        <span><kbd>Enter</kbd> open</span>
        <span><kbd>Esc</kbd> leave</span>
      </p>
      <div
        ref={labelRef}
        class="studio__label"
        data-kind={hover?.kind ?? 'project'}
        hidden={!ready || !hover}
        aria-hidden="true"
      >
        <p class="studio__name">{hover?.name}</p>
        {hover?.body && <p class="studio__body">{hover.body}</p>}
      </div>
    </>
  );
}
