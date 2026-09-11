# E08 — The gate

**Goal:** `/` becomes a choice between two worlds. Typographic, instant, and
working with JavaScript disabled.

**Depends on:** E01 (tokens, fonts, content model).

## Why it is not 3D

Yazan asked for a 3D door. I argued against it and he took the argument: the
landing page is the single place where the sub-second, zero-JS first paint matters
most, because it is what a recruiter hits from a LinkedIn tap on bad wifi. The 3D
lives inside both worlds, where it has already been paid for.

That raises the bar on the typography. A gate that is only two links in a stack is
a nav bar, not a door.

## Tasks

- [x] **E08-T1** — Move the story to `/story`. Keep `/` free for the gate.
      Old inbound links to `/` still land somewhere sensible.
- [x] **E08-T2** — `src/pages/index.astro`: the gate. Two destinations, each with
      a name, a one-line proposition, and enough type to feel like a decision.
- [x] **E08-T3** — Give each door a distinct visual weight so the choice is not
      symmetrical. They are not equivalent products: one is a story, one is
      evidence.
- [x] **E08-T4** — Hover and focus states that make the doors feel like doors —
      a hit target that is the whole panel, not the text.
- [x] **E08-T5** — Persistent way back to the gate from inside both worlds,
      without it reading as chrome.
- [x] **E08-T6** — Metadata for the gate: it is now the page that gets shared, so
      it owns the canonical URL, the OG card, and the `Person` schema.
- [x] **E08-T7** — Reduced-motion and no-JS pass on the gate specifically.

## Acceptance

- With JavaScript disabled, both doors work as links.
- FCP on the gate is under 600 ms on the throttled mobile profile.
- Zero client JS on the gate. It has no interactive behaviour that needs any.
- The gate does not look like a nav bar with two items.

## Build notes

The gate's `h1` is *"They gave me electrical engineering. I took computer science
anyway."* It replaced a door metaphor that had the same fault as the old story
opening: two figures of speech stacked on each other, and nothing concrete to hold.

The line does the whole job in nine words. Constraint, refusal and outcome, with
no metaphor to decode, and "anyway" carries the family pushback, the night study
and the abandoned degree without naming any of them. It is also the `og:description`,
so it is the caption under every share card.

**The two doors are deliberately asymmetrical.** The story door makes a promise.
The work door shows what is behind it — all three projects with their real status.
Showing the contents is more persuasive than making the word bigger, and it means a
recruiter can see Driven, Complytude and Jeem without clicking anything.

Two things the audit caught, both real:

- The gate had **no `h1`** — the statement was a `<p>` and the door names were
  `h2`. Fixed; the statement is the heading.
- The gate copy said *"four countries of clients"*, which I invented. Nothing in
  the CV or the story supports it. Replaced with "a move to Dubai", which the story
  does support. SPEC.md's rule that every claim stays checkable applies to copy I
  write, not only to the metrics.

The audit's zero-JS assertion had to be narrowed: `document.scripts` includes the
`application/ld+json` block, which is data rather than executable code.

## Out of scope

Anything inside either world.
