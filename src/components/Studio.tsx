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
      let shown = '';
      const onHover = (anchor: HoverAnchor) => {
        const key = anchor ? `${anchor.kind}:${anchor.name}` : '';
        if (key !== shown) {
          shown = key;
          if (anchor) {
            // Whether anyone actually explores the room, rather than scrolling
            // past it to the index below.
            trackOnce('studio:used', 'studio_used');
            if (anchor.kind === 'note') {
              trackOnce(`note:${anchor.name}`, 'note_open', { note: anchor.name });
            }
          }
          setHover(
            anchor
              ? {
                  kind: anchor.kind,
                  name: anchor.name,
                  body: anchor.kind === 'note' ? anchor.body : undefined,
                }
              : null,
          );
          // Only the projects go anywhere, so only they get a pointer.
          host.style.cursor = anchor?.kind === 'project' ? 'pointer' : '';
        }
        const node = labelRef.current;
        if (node && anchor) {
          // Keep the card on screen: props near the walls would otherwise centre
          // their label past the edge of the canvas and get clipped.
          const pad = 14;
          const halfW = node.offsetWidth / 2;
          const x = Math.min(
            Math.max(anchor.x, halfW + pad),
            Math.max(halfW + pad, host.clientWidth - halfW - pad),
          );
          // Wall posters sit high, so their card would land on top of the
          // section links. Push it clear of them when there is room.
          const nav = document.querySelector('.studio__nav');
          const guard = nav
            ? nav.getBoundingClientRect().bottom - host.getBoundingClientRect().top
            : 0;
          const y = Math.max(anchor.y, node.offsetHeight + Math.max(pad, guard + pad));
          node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;
        }
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

      const onMove = (event: PointerEvent) => {
        const box = host.getBoundingClientRect();
        const nx = ((event.clientX - box.left) / box.width) * 2 - 1;
        const ny = -(((event.clientY - box.top) / box.height) * 2 - 1);
        studio.setPointer(nx, ny);
        studio.setDrag(nx, ny);
      };

      const onLeave = () => {
        studio.setPointer(-2, -2);
        studio.setDrag(0, 0);
      };

      const onClick = () => {
        const id = studio.pick();
        if (!id) return;
        track('artifact_open', { project: id });
        window.location.href = `/work/${id}`;
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
