# E04 — Scroll binding

**Goal:** GSAP ScrollTrigger converts scroll position into `StoryState` and
publishes it. This epic owns every read of scroll position on the page.

**Depends on:** E02 (the sections must exist to trigger against), E03 (the contract).

## Tasks

- [x] **E04-T1** — `src/scripts/story.ts`: register ScrollTrigger, create one
      trigger spanning the story container, publish `story:state` on update.
- [x] **E04-T2** — Chapter resolution: map raw progress to `chapter` and
      `chapterProgress` from the real section offsets, not a fixed division by ten.
      Sections differ in height and the mapping must follow the DOM.
- [x] **E04-T3** — Pin the stage for the whole story, §1 through §10. Corrected
      from an earlier reading: §8 says the background gets out of the way, but §10
      still has the light arriving at the front, so the scene never unmounts. "Out
      of the way" is a keyframe (nearly still, dim), not a release.
- [x] **E04-T4** — `ScrollTrigger.refresh()` on resize and after fonts load, so the
      chapter offsets stay correct when layout shifts.
- [x] **E04-T5** — Reduced-motion path: publish chapter 9 state once, create no
      scrub. The page scrolls normally as a document.
- [x] **E04-T6** — Verify the scroll bundle stays free of three.js. If the built
      chunk containing GSAP also contains three, the contract has been violated.

## Build notes

**The stage is pinned by CSS `position: sticky`, not by ScrollTrigger.** Two
reasons: sticky works with JavaScript disabled, so the layout is correct before
any script runs; and a GSAP pin rewrites the DOM around the pinned element, which
would fight the negative-margin overlay the chapters rely on. ScrollTrigger only
measures here — it never moves anything.

The mapping lives in `src/scripts/chapter-position.ts` as a pure function so it can
be tested without a DOM. Covered: anchors land on exact chapter boundaries with
zero progress, midpoints interpolate, both ends clamp, and global progress is
monotonic across the full scroll.

Measured after this epic:

| | gzipped |
|---|---|
| Eager JS in the document | **752 B** |
| GSAP + ScrollTrigger (lazy) | 44 KB |
| three.js (lazy) | 129 KB |
| Preact runtime (lazy) | 4.4 KB |

Reduced motion downloads none of the GSAP figure.

## Acceptance

- Scrolling the full page emits a monotonic `progress` from 0 to 1 with no jumps.
- `chapter` changes exactly when the corresponding section reaches the reading
  position, verified against all ten.
- Resizing the window mid-story does not desynchronise the scene from the text.
- With `prefers-reduced-motion`, no scrub is created and scrolling is native.
- The GSAP chunk and the three.js chunk are separate files in `dist/`.

## Out of scope

Scene visuals. Any per-element entrance animation — the spec rules those out.
