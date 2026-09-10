# E01 — Foundation and content model

**Goal:** every word in `SPEC.md` exists as typed data, and the visual system is
defined once as tokens. No section markup yet.

**Depends on:** nothing. Everything else depends on this.

## Why this is its own epic

Copy for this site is unusually load-bearing — it is a personal narrative where a
changed number breaks a factual claim. Putting it in a typed data layer means the
story can be proofread in one file, and the timeline constraint recorded in
`SPEC.md` stays enforceable rather than scattered across ten components.

## Tasks

- [x] **E01-T1** — `src/content/story.ts`: the ten chapters as a typed array.
      Each chapter carries `id`, `index`, `kicker`, `paragraphs[]`, and the
      `sceneNote` from the spec (kept as data so E03 can assert coverage).
- [x] **E01-T2** — `src/content/work.ts`: the four blocks from §8, each with
      `org`, `period`, `body`, and a `claims[]` array isolating the checkable
      metrics (25% p95, 7% organic sessions, two pages in Google) so they can be
      reviewed as a set.
- [x] **E01-T3** — `src/content/recommendations.ts`: both recommendations, storing
      `full` (verbatim) and `display` (the trim) separately, plus author, title,
      relationship, and date.
- [x] **E01-T4** — `src/content/meta.ts`: name, role, email, LinkedIn, GitHub,
      page title, description.
- [x] **E01-T5** — Design tokens in `src/styles/tokens.css`: colour, type scale,
      spacing rhythm, measure, breakpoints. One definition each, no per-component
      redefinition.
- [x] **E01-T6** — Fonts via Astro's `fonts` config (self-hosted, `fontsource`
      provider). Preload only the face used above the fold.
- [x] **E01-T7** — `src/layouts/Story.astro`: document shell, skip link, font
      wiring, `lang`, global stylesheet import.
- [x] **E01-T8** — Delete the scaffold placeholders (`Scene.tsx`, `scroll.ts`,
      `global.css`, the three dummy sections) once the real shell replaces them.

## Acceptance

- `astro check` passes with no `any` in the content layer.
- Every paragraph in `SPEC.md` §1–§10 has a corresponding entry in the data files.
  No copy is inlined in a component.
- The Luis recommendation stores the verbatim text alongside the trim, so the
  editorial cut is visible in code review.
- Tokens render a legible page with no component CSS written yet.

## Out of scope

Section markup, the scene, any scroll behaviour.

## Decisions taken

**Direction: Observatory.** Cold blue-black ground (`#080B14`) so the scene's warm
light reads as genuinely warm rather than as a yellow tint on grey. Newsreader
(serif) carries the narrative; Archivo carries metadata — orgs, periods, bylines.
The accent `#F4A94C` is the same warm as the light in the scene, and on the page it
is spent only on focus rings and the contact link.

**Gotcha for later epics:** in Astro 7.3.1 there is no `astro:fonts` virtual module,
despite what the docs page shows. The component is imported directly:
`import Font from 'astro/components/Font.astro'`.
