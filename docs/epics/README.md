# Epics

Breakdown of [`SPEC.md`](../../SPEC.md) into deliverable units. Each epic has a goal,
explicit dependencies, numbered tasks, and acceptance criteria that can be checked
without reference to the others.

Ordered by dependency. E03 and E04 can run in parallel once E01 lands — that is the
point of the state contract described in E03.

| # | Epic | Depends on | Status |
|---|---|---|---|
| E01 | [Foundation and content model](E01-foundation.md) | — | **done** |
| E02 | [The static story](E02-static-story.md) | E01 | **done** (rhythm pass moved to E11) |
| E03 | [The scene](E03-scene.md) | E01 | **done** |
| E04 | [Scroll binding](E04-scroll-binding.md) | E02, E03 | **done** |
| E05 | [Interaction and detail](E05-interaction.md) | E02 | **done** |
| E06 | [Responsive, a11y, reduced motion](E06-responsive-a11y.md) | E02, E03, E04 | **done** |
| E07 | [Performance, metadata, ship](E07-ship.md) | all | **done** except deploy (T9) |

## Phase two — two worlds behind one door

Brief: [`docs/WORK-SPEC.md`](../WORK-SPEC.md).

| # | Epic | Depends on | Status |
|---|---|---|---|
| E08 | [The gate](E08-gate.md) | E01 | **done** |
| E09 | [Work content and case studies](E09-work-content.md) | E01 | **done** except per-page OG (T7) |
| E10 | [The studio](E10-studio.md) | E09 | **done**; T5 deliberately dropped, T4 open |
| E11 | [Story refresh](E11-story-refresh.md) | E08 | **done** except T4 (load moment) |

## The one architectural decision that shapes the rest

The scene never imports the scroll code and the scroll code never imports the scene.
They communicate through a `story:state` CustomEvent carrying `{ progress, chapter,
chapterProgress }`. Two consequences worth protecting:

- three.js stays in a bundle that is only fetched when the stage becomes visible.
  A shared import would pull it into the eager graph and defeat `client:visible`.
- The scene can be driven by a debug slider before ScrollTrigger exists, and the
  scroll binding can be verified by logging state before the scene exists.

## What is actually left

| | Blocked on |
|---|---|
| E11-T4 — one orchestrated entrance moment on load | nothing |
| E10-T4 — keyboard path into the 3D room | nothing; the index list under the room is the current fallback |
| E09-T7 — per-case-study OG cards | nothing |
| E07-T8 — fact-check the four `claims[]` | **Yazan** |
| E07-T9 — deploy and domain (analytics done) | **Yazan** |

**E10-T5 was dropped on purpose.** Selecting an artifact navigates straight to the
case study instead of opening a panel inside the room. Fewer states, and the case
study is where the depth lives anyway.

## Verifying

`node tools/audit.mjs <url>` checks the gates below. Point it at a **preview of the
production build**, not the dev server. `node tools/shot.mjs <url> shots` and
`node tools/shot-mobile.mjs` capture the page for visual review.

## Non-negotiables (from SPEC.md, restated as gates)

These are checked in E06 and E07, but every epic is written not to violate them:

1. The full story reads with JavaScript disabled.
2. The full story reads under `prefers-reduced-motion`, with a static composition.
3. three.js is lazy-loaded. It is never in the critical path to first paint.
4. On mobile the scene simplifies. It does not disappear.
5. Every metric on the page is checkable.
