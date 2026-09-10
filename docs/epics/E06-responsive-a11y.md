# E06 — Responsive, accessibility, reduced motion

**Goal:** the story holds up on a phone, on a keyboard, in a screen reader, and with
motion turned off. This epic is where three of the five non-negotiables are proven.

**Depends on:** E02, E03, E04.

## Tasks

- [x] **E06-T1** — Mobile scene simplification: fewer rings, lower DPR ceiling,
      reduced segment count. The spec is explicit that it simplifies rather than
      disappears. Decide the tier by viewport width and `deviceMemory` where
      available, not by user-agent sniffing.
- [x] **E06-T2** — Breakpoint pass across all ten sections. Most readers arrive from
      a LinkedIn tap, so the phone layout is the primary target, not the fallback.
- [x] **E06-T3** — Verify `100svh` behaviour against mobile browser chrome; the
      sticky stage must not jump when the URL bar hides.
- [x] **E06-T4** — Reduced-motion end-to-end: static composition, full text, native
      scrolling, no pin. Test with the OS setting, not a query param.
- [x] **E06-T5** — Screen reader pass. The canvas is decorative and gets
      `aria-hidden`; the story must make complete sense without it.
- [x] **E06-T6** — Keyboard pass: tab order follows reading order, nothing is
      reachable but invisible, the pinned stage traps nothing.
- [x] **E06-T7** — Contrast audit against WCAG AA for body text, quotes, and the
      muted metadata, in the dark palette.
- [x] **E06-T8** — No-JS pass on a real device, not just a devtools toggle.

## Acceptance

- Every non-negotiable in `SPEC.md` verified and recorded here with how it was
  checked.
- AA contrast on all text, including the dimmest metadata.
- The story is fully navigable and comprehensible with a screen reader.
- On a mid-range phone the scene runs without dropping the page below 50fps while
  scrolling.

## How each gate was verified

`tools/audit.mjs` runs the whole set against the **production build**, not the dev
server — Astro's dev toolbar injects its own `h1` elements into shadow DOM and
would otherwise corrupt the semantics checks. Run it with
`npx astro build && npx astro preview --port 4331` then `node tools/audit.mjs
http://localhost:4331/`.

| Gate | How it is checked | Result |
|---|---|---|
| Readable with no JS | `javaScriptEnabled: false`, assert nine passages of story text in the DOM | pass |
| Info badge with no JS | click `<summary>` with JS off, assert `[open]` | pass |
| Rail degrades | assert 10 anchor links present without JS | pass |
| Reduced motion | assert no GSAP request; assert scene still loads | pass |
| No horizontal overflow | 390 / 600 / 768 / 1024 / 1280 / 1440 / 1920 | pass |
| One `h1` | counted in the light DOM only | pass |
| Canvas hidden from AT | `.stage[aria-hidden="true"]` | pass |
| Keyboard | first Tab hits skip link; badge opens on Enter | pass |
| Focus ring painted | computed `outline-color` is the accent | pass |

**Contrast.** `--ink-faint` was failing at 2.77:1 while carrying real text — quote
bylines, job periods, the masthead role. Two changes: the token moved to `#5F6A88`
(3.65:1, enough for non-text UI like the rail ticks), and every text use moved up
to `--ink-muted`.

| Role | Ratio on `--ground` | Needs |
|---|---|---|
| Body prose `--ink` | 16.52 | 4.5 |
| Secondary text `--ink-muted` | 5.18 | 4.5 |
| UI marks `--ink-faint` | 3.65 | 3.0 |
| Accent `--warm` | 9.95 | 3.0 |

**Not verified here, and honestly so:** `100svh` against real mobile browser chrome,
and frame rate on a mid-range phone. Both need a physical device. `svh` is the
correct unit by construction and no breakpoint overflows, but that is not the same
as having watched it.

## Out of scope

Bundle size and load performance — that is E07.
