# Work world — brief

Extends [`SPEC.md`](../SPEC.md). Decisions below were settled with Yazan on
2026-09-10 and are not open unless he reopens them.

## Two worlds, two palettes

Settled 2026-09-10 after three rendered directions. The site is not one look — it
is two, and the gate is the seam.

| | Story | Work |
|---|---|---|
| Name | Oxblood | Signal |
| Ground | `#191016` deep plum, lit corner | `#0B0B0C` neutral black, faint grid |
| Ink | `#F3E9E4` warm ivory | `#F4F4F2` cool white |
| Accent | `#E0736E` rose | `#8B5CF6` violet |
| Display | Instrument Serif | Bricolage Grotesque 600 |
| Text | Newsreader | Archivo |
| Data | — | monospace |

Both palettes clear WCAG AA for text and 3:1 for UI marks; `--ink-faint` had to be
raised in both worlds to get there.

**The gate belongs to neither.** It is a neutral hall, and each door renders in the
palette and typeface of the world it opens — so the choice is visible before it is
made. Implemented as `data-world` on the door element itself; the token blocks are
attribute selectors, so a door literally paints in its destination's colours.

Component CSS names only tokens, never values, so one component reads correctly in
either world.

## Shape

The site becomes two worlds behind one door.

```
  /            the gate — typographic, instant, two ways in
   ├─ /story   the scroll narrative (exists; light refresh only)
   └─ /work    the architect's studio (new)
        ├─ /work/driven
        ├─ /work/complytude
        └─ /work/jeem
```

## The gate

**Typography, not 3D.** Yazan asked for a 3D door; I argued the landing is the one
place the no-JS, sub-second first paint guarantee matters most, and he took the
counter-argument. The 3D lives inside both worlds instead.

It must paint instantly, work with JavaScript disabled, and make the choice feel
like a real fork rather than a nav bar.

## The studio

An **architect's studio** seen from a **fixed viewpoint** — you stand at the desk
and drag to look. No walking, no getting lost, one vantage to art-direct.

On a phone the camera pulls back and the same studio becomes a **diorama** you turn
with a thumb. Same geometry, same objects, one camera change — not a second build.

Three objects, one per project. Each opens into a real case-study page.

| Object | What it is | Artifact on the desk |
|---|---|---|
| Driven Properties | Listings and filtering rebuild, live in production | Screen: the live listings page |
| Complytude | Multi-tenant legal-compliance SaaS, backend only | Architecture diagram |
| Jeem | Frontend rewrite of an AI answer engine | Screen: the chat UI, streaming |

Complytude has no UI, which is the point — its artifact is a drawing, and in an
architect's studio a drawing is not a consolation prize.

## Case studies

**Ported into this site**, not linked out. `yazan-ali.net` currently hosts two
well-written case studies; this site replaces it, so they come across and get the
new typography.

- `/work/driven` — from the existing Driven Properties case study
- `/work/complytude` — from the existing Complytude case study, diagram included
- `/work/jeem` — **does not exist yet.** I draft it; Yazan corrects the technical
  detail before it ships.

### Jeem: what the case study is about

Yazan's brief, verbatim in substance:

- He was the frontend engineer who rebuilt the whole frontend (Next.js Pages Router
  → Next.js 15), around clear UI / business-logic / data-access boundaries.
- **How hard the dynamic UI of an AI chatbot is** — responsive conversations,
  streaming interactions, complex UI states.
- **How much clean CSS it demanded** — the CSS architecture is a first-class part
  of the story, not a footnote.
- **Streaming**: how backend SSE was handled in Next.js.
- He also worked with the backend team on V2 API contracts and clearer
  frontend/backend boundaries.

Jeem is an AI answer engine for MENA — Arabic and dialect-specific search. Formerly
Fyler.

**Everything technical in this case study is unverified until Yazan reviews it.**
The SSE contract, what actually broke, and the specific CSS problems are his to
confirm. Do not ship it on my drafting alone.

## Assets

Captured with `node tools/capture.mjs` into `shots/work/`:

- `driven-listings.png` — the live listings page, filter bar and facets visible
- `jeem-home.png` — the Jeem landing page

Still needed:

- **Jeem in a streaming state.** The landing capture shows the search box, not the
  thing the case study is about. Either Yazan supplies a capture, or I drive the
  public demo to produce one — his call, since it means interacting with a live
  third-party product.
- **The Complytude diagram**, from the existing case study page.
- Any screenshots of work behind auth (the ERP platform, Complytude's admin).

## What is NOT changing

The scene engine (`src/scene/`), the state contract (`src/lib/story-state.ts`), the
content model in `src/content/`, and the audit tooling all survive. The studio is a
second consumer of the same architecture, not a replacement for it.

## Story world

Targeted fixes only — chapter rhythm, the dead space between chapters, entrance
moments. Engine, keyframes and content model untouched.
