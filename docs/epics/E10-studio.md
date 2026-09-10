# E10 — The studio

**Goal:** an architect's studio you look around from the desk, holding three
projects. On a phone the same room becomes a diorama you turn with a thumb.

**Depends on:** E09 (needs projects), E01.

## What it reuses

The scene engine already exists and is not being rebuilt. The studio is a second
consumer of the same architecture the story uses:

- `src/lib/story-state.ts` — the decoupling pattern; the studio gets its own
  equivalent so scene code and interaction code never import each other.
- The island pattern — one `client:visible` component, three.js behind a dynamic
  import, nothing on the critical path.
- The self-stopping render loop — no frames scheduled while idle.
- `tools/audit.mjs`, `tools/shot.mjs`, `tools/perf.mjs`.

## Tasks

- [x] **E10-T1** — Studio geometry: desk, wall, and the surfaces the artifacts sit
      on. Restraint is the whole risk here — desk scenes are a 3D-portfolio trope
      and only survive if the room is spare.
- [x] **E10-T2** — Fixed-viewpoint camera with a bounded drag-to-look, so no one
      can end up facing a blank wall.
- [x] **E10-T3** — Three artifacts, one per project: two screens and a drawing.
      They carry the real captures as textures.
- [ ] **E10-T4** — Hover and focus affordance in 3D, plus a real DOM focus path so
      the studio is operable by keyboard.
- [ ] **E10-T5** — Selecting an artifact: it comes forward and opens a panel with
      the project summary and a route into the case study.
- [x] **E10-T6** — Diorama camera for phones: same geometry, camera pulled back,
      drag to rotate the whole room.
- [x] **E10-T7** — Lighting. The story world is a cold blue ground with one warm
      light; the studio has to belong to the same site without repeating it.
- [x] **E10-T8** — No-JS and reduced-motion fallback: the three projects as a
      readable list. The studio is an enhancement, never the only way to the work.
- [x] **E10-T9** — Texture budget. Screenshots as textures are the heaviest thing
      in this build; they need sizing and compression discipline.

## What made it a room

The first build was three textured planes and a dark slab, and Yazan was right to
call it out: *"I can't see a room or anything cool."* Being spare is not a defence
when the brief was a room you look around.

What was actually missing, in order of how much each one mattered:

1. **Enclosure.** Floor, back wall and two side walls, so there are corners. A
   plane floating in front of another plane never reads as a space.
2. **Shadows.** Objects that cast onto the desk and floor stop hovering and start
   sitting on something. This is the single biggest cue, and it was absent.
3. **A desk with volume** — legs, thickness, a front edge that recedes — instead of
   a flat box.
4. **Falloff.** Low ambient plus a spot means the corners go dark and the desk is
   the lit place. Even lighting reads as a render, not a room.
5. **Props for scale.** A mug, a rolled drawing, papers, a lamp. Without them a
   textured plane has no size, because nothing tells you how big it is.

The lamp is not decoration: it is the reason the desk is lit, and the warm pool it
throws is what makes the neutral Signal palette feel occupied.

## Build notes

**Framing is computed, not hardcoded.** The first pass used magic camera numbers
tuned at 1440px; at 390px portrait the room cropped in half, because a narrow
viewport has a far smaller horizontal field at the same distance. `fit()` now
derives the camera distance from the content half-extents and the live aspect
ratio, so desktop and the phone diorama come from one rule.

A related bug worth remembering: `fit()` wrote `HOME.z`, but the frame loop only
applied `HOME.x` and `HOME.y`. The camera kept its constructed z and nothing moved.

**Materials are split on purpose.** The room uses `MeshStandardMaterial` and real
lights so it reads as a space; the artifacts use unlit `MeshBasicMaterial` so the
screenshots show true colour instead of being tinted by the room.

**Texture budget:** 1.5 MB of source captures re-rendered to 172 KB of JPEG at
1024px wide (`tools/textures.mjs`). Originals stay for the case study pages, where
they are shown large.

## Acceptance

- Every project is reachable with JavaScript disabled.
- No frames scheduled while the studio is idle or off-screen.
- three.js still absent from the initial document request.
- Keyboard alone can reach and open all three projects.
- Holds 50fps while looking around on a mid-range phone.

## Risks

**The trope risk.** A 3D desk is one of the most common portfolio clichés. It
survives only if the room is spare, the lighting is considered, and the artifacts
are real screenshots rather than fake UI.

**The texture risk.** Three screenshots at usable resolution can outweigh
everything else on the page. Budget them before modelling, not after.
