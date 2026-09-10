# E02 — The static story

**Goal:** all ten sections rendered as semantic HTML. The story is complete and
readable before a single line of JavaScript runs.

**Depends on:** E01.

## Why this is its own epic

This is the deliverable that satisfies non-negotiable #1, and it is much easier to
guarantee by building the page this way than by building an animated page and
retrofitting a no-JS fallback. When this epic closes, the site is already shippable
— everything after it is enhancement.

## Tasks

- [x] **E02-T1** — `Chapter.astro`: one component rendering a chapter from the E01
      data. Handles the kicker, heading, and body paragraphs.
- [x] **E02-T2** — Sections 1–7 composed from `Chapter.astro`. Verify the §1 opening
      lands as a statement, not a headline with a subhead.
- [x] **E02-T3** — §1 info badge markup: native `<details>`/`<summary>`. Works with
      no JS by construction; E05 handles its styling and motion.
- [x] **E02-T4** — §8 work blocks. Four entries, restrained — the spec explicitly
      rules out a card grid and a logo wall.
- [x] **E02-T5** — §9 recommendations as `<figure>`/`<blockquote>`/`<figcaption>`,
      rendering `display` text. No carousel, no auto-rotation.
- [x] **E02-T6** — §10 closing and contact. Plain `mailto:` and profile links,
      no form.
- [x] **E02-T7** — The sticky stage container and scroll structure, with the scene
      slot left empty. Establishes the layout E03 mounts into.
- [ ] **E02-T8** — Vertical rhythm and measure pass across all ten sections.
      **Moved to E11-T1**, which is the same job stated better. Tracked there.

## Acceptance

- With JavaScript disabled in the browser, every word of §1–§10 is readable and
  every link works, including the expanded info badge.
- Heading hierarchy is a single `h1` followed by correctly nested `h2`/`h3`.
- No text exceeds the measure defined in E01 tokens.
- Zero client JS in the built output for this page at this stage — verifiable in
  `dist/`.

## Out of scope

The scene, scroll binding, motion of any kind.
