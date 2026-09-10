# E09 — Work content and case studies

**Goal:** three projects modelled as data, and three real case-study pages. The
studio needs something to be about.

**Depends on:** E01.

## Tasks

- [x] **E09-T1** — `src/content/projects.ts`: the three projects as typed data —
      id, name, role, period, one-line proposition, stack, status, live URL,
      artifact kind (`screen` | `diagram`), and the `claims[]` treatment already
      used in `work.ts`.
- [x] **E09-T2** — Port the Driven Properties case study from the existing
      `yazan-ali.net` page into this site's content model and typography.
- [x] **E09-T3** — Port the Complytude case study, including its architecture
      diagram. Complytude is backend-only, so the diagram is the hero image, not
      a supporting figure.
- [x] **E09-T4** — **Draft** the Jeem case study from Yazan's brief, his CV, and
      the live product. Focus, in his words: the dynamic UI of an AI chatbot, the
      CSS architecture it demanded, and SSE streaming handled in Next.js.
      Mark every technical specific as unverified until he reviews.
- [x] **E09-T5** — `src/layouts/CaseStudy.astro` and `/work/[slug]` routing.
- [x] **E09-T6** — Case-study page design: long-form technical prose that holds up
      next to the story world without copying its layout.
- [ ] **E09-T7** — Per-case-study metadata and OG cards.
- [x] **E09-T8** — Capture pipeline: `tools/capture.mjs` regenerates the live
      screenshots so they never go stale by hand.

## Acceptance

- All three projects render as complete pages with no placeholder text.
- Every case study reads correctly with JavaScript disabled.
- No copy is inlined in a component; it all lives in `src/content/`.
- Every metric carries its basis, same discipline as `work.ts`.

## Open

**Jeem's technical detail is drafted, not sourced.** It cannot ship until Yazan
confirms the SSE contract, what actually broke, and the CSS specifics. Flagged in
the file itself, not just here.
