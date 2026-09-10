# E05 — Interaction and detail

**Goal:** the handful of things a reader can actually operate, plus the typographic
detail that separates a finished page from a laid-out one.

**Depends on:** E02.

## Why this is small on purpose

The spec allows almost no motion: no autoplay, no per-card hover animation, no
carousel. Interaction here means the info badge, links, and focus states. Keeping
this epic deliberately narrow is how that restraint survives contact with the build.

## Tasks

- [x] **E05-T1** — Style the §1 info badge. Expand and collapse is the one motion
      that answers a reader's action, so it may animate; it must remain a native
      `<details>` and work with no JS.
- [x] **E05-T2** — Focus-visible treatment across every interactive element, using
      the accent from E01. Visible against the dark ground at every size.
- [x] **E05-T3** — Link treatment for §10 contact and inline references. Hover is a
      colour or underline change, not a transform.
- [x] **E05-T4** — Typographic pass: hanging punctuation on the pull quotes, correct
      dashes and apostrophes throughout, `text-wrap: balance` on headings, widow
      control on short paragraphs.
- [x] **E05-T5** — Selection colour and caret colour set deliberately.
- [x] **E05-T6** — Audit for stray transitions. Anything animating that a reader did
      not trigger gets removed unless the spec asks for it.

## Acceptance

- The info badge opens and closes by keyboard alone, with a visible focus ring.
- Nothing on the page animates without either a scroll change or a user action.
- Every quotation mark, apostrophe, and dash is the correct character.

## Build notes

Punctuation was converted at the source: 38 straight quotes and apostrophes across
the three content files became typographic ones. The conversion only touched text
inside backtick template literals, because single quotes elsewhere in those files
are TypeScript string delimiters.

The info badge animates with `::details-content` plus `interpolate-size:
allow-keywords`, so it opens smoothly where that is supported and instantly where
it is not. It stays a native `<details>` either way.

**Transition audit — the complete list on the page:**

| Where | What | Trigger |
|---|---|---|
| `Chapter.astro` | summary colour | hover |
| `Chapter.astro` | badge open/close | click |
| `index.astro` | contact mail colour | hover |
| `index.astro` | profile link colour and rule | hover |

Nothing transitions without a reader acting, which is what SPEC.md asks for. The
reduced-motion block in `base.css` disables all four regardless.

Removed: a `hanging-punctuation` rule on `blockquote`. The recommendations are set
with a rule rather than quotation marks, so it styled nothing.

## Out of scope

Scene, scroll, layout structure.
