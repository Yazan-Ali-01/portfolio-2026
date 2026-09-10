# Yazan Ali — portfolio

A scroll-driven narrative portfolio. Ten chapters, one continuous WebGL scene
behind them. The brief is in [`SPEC.md`](SPEC.md); the build is broken down in
[`docs/epics/`](docs/epics/README.md).

## Why Astro, not Next.js

The spec's build notes suggested Next.js. Astro was chosen instead, deliberately.

This is one static page. No data fetching, no auth, no API routes, no
revalidation — so App Router, Server Components and caching would all go unused
while still shipping a React runtime on every visit. Meanwhile the spec's own
non-negotiables point the other way:

- *"The full story must be readable with JavaScript disabled."* In Astro that is
  the default state. In Next it is something you engineer toward and then verify.
- *"Lazy-load the three.js bundle."* `client:visible` is a first-class primitive
  here; the Next equivalent is `next/dynamic` plus an IntersectionObserver you
  write yourself.
- *"Most people will read this on a phone from a LinkedIn tap."* That is exactly
  where baseline framework JavaScript costs the most.

React Three Fiber was considered and rejected. It would not have required Next
either — Astro supports React, and R3F runs fine inside a `client:visible` island.
But the scene is one object driven by a single scroll scalar, which is what
imperative three.js is already good at.

Preact is present for one reason: `client:*` directives need a framework
component, and it is the smallest one. Exactly one component hydrates.

## Architecture

The scene and the scroll binding **never import each other**. They communicate
through a `story:state` CustomEvent carrying `{ progress, chapter, chapterProgress }`:

```
src/scripts/story.ts   ──publishes──▶  story:state  ──▶  src/components/Scene.tsx
   (GSAP ScrollTrigger)                                     (three.js island)
```

Two things fall out of that. three.js stays in a chunk that is only fetched once
the stage is visible — a shared import would drag it into the eager graph. And
each half is testable alone: the scene has a debug slider at `?debug=scene`, and
the scroll mapping is a pure function with no DOM.

Keyframes are anchored to the moment each section reaches the centre of the
viewport, not to raw scroll fraction, so a chapter that runs three screens long
still takes exactly one keyframe step.

## What ships

Measured on the production build, gzipped:

| | | |
|---|---|---|
| `index.html` | 8.4 KB | immediately |
| CSS | 2.3 KB | immediately |
| JS | **0.9 KB** | immediately |
| 2 × Newsreader woff2 | 46 KB | preloaded |
| three.js | 129 KB | lazy, after first paint |
| GSAP + ScrollTrigger | 44 KB | lazy, never under reduced motion |
| Preact runtime | 4.4 KB | lazy |

On slow 4G with 4× CPU throttling at 390px: **FCP and LCP both 508 ms**. The story
text needs none of the JavaScript.

## Commands

```
pnpm dev                                  # dev server (astro dev --background)
pnpm build && pnpm preview --port 4331    # production build

node tools/audit.mjs http://localhost:4331/   # no-JS, reduced motion, a11y, breakpoints
node tools/perf.mjs  http://localhost:4331/   # throttled FCP/LCP and load ordering
node tools/shot.mjs  http://localhost:4321/ shots   # desktop screenshots
node tools/shot-mobile.mjs                          # mobile screenshots
node tools/og.mjs                                   # regenerate public/og.jpg
```

Run `audit.mjs` against a **preview of the production build**, not the dev server:
Astro's dev toolbar injects its own `h1` elements into shadow DOM and corrupts the
semantics checks.

## Content

All copy lives in `src/content/` and nowhere else.

- `story.ts` — the ten chapters, plus each one's scene direction
- `work.ts` — the four roles, with every checkable metric isolated in `claims[]`
- `recommendations.ts` — both recommendations, storing the verbatim text
  alongside the trim that renders, so the editorial cut stays reviewable
- `meta.ts` — identity, links, and the values behind the `Person` schema

**Timeline constraint:** chapters 6 and 7 total two months of job hunting, matching
BeIn Media ending Feb 2023 and Royal Class starting Apr 2023. If the CV or the copy
changes, the other has to move with it.
