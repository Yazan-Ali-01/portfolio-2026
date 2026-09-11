import { useEffect, useRef, useState } from 'preact/hooks';
import type { ArtifactSpec, DeskNoteSpec, HoverAnchor } from '../scene/studio';
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
  const [hover, setHover] = useState<Hover>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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

      const studio = createStudio(canvas, artifacts, { compact, notes, onHover });
      setReady(true);

      const setSize = () => {
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (w > 0 && h > 0) studio.resize(w, h);
      };
      setSize();

      const ro = new ResizeObserver(setSize);
      ro.observe(host);

      const io = new IntersectionObserver(([e]) => studio.setActive(e.isIntersecting), {
        threshold: 0,
      });
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

      const onLeave = () => {
        studio.setPointer(-2, -2);
        studio.setDrag(0, 0);
      };

      const onClick = (event: MouseEvent) => {
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

      host.addEventListener('pointermove', onMove);
      host.addEventListener('pointerleave', onLeave);
      host.addEventListener('click', onClick);

      cleanup = () => {
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
      <canvas ref={canvasRef} class="studio__canvas" aria-hidden="true" />
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
