# E11 — Story refresh

**Goal:** fix what makes the story world feel like a template, without touching the
engine.

**Depends on:** E08 (the story moves to `/story`).

## Why this is deliberately narrow

Yazan chose targeted fixes over a rebuild. The scene, the keyframe table, the
scroll binding and the content model are all working and audited. What is wrong is
rhythm and density, not architecture.

His words: *"the text is very scattered"* and *"this kind of boring template."* The
column-centring bug behind the first complaint is fixed; the rest is pacing.

## Tasks

- [ ] **E11-T1** — Chapter rhythm. Every chapter is currently `min-height: 100svh`
      with centred text, which makes short chapters read as voids. Vary the
      treatment by chapter weight.
- [ ] **E11-T2** — Give the opening its own composition rather than being chapter
      zero in a uniform sequence.
- [ ] **E11-T3** — §8 and §9 shift register from narrative to evidence; make that
      shift visible in the layout, not just the heading size.
- [ ] **E11-T4** — One orchestrated entrance moment on load. Not per-section
      fade-ups — SPEC.md rules those out explicitly.
- [x] **E11-T5** — Revisit §8 now that `/work` exists. **Removed entirely** on
      2026-09-11: the story is narrative only, the studio holds the projects.
      Nine chapters now, nine keyframes.

      **Cost, on the record:** Royal Class Group and the four-engineer ERP lead
      appeared only in §8 and now appear nowhere on the site. Copy is preserved in
      `src/content/work.ts`, which is no longer rendered.
- [ ] **E11-T6** — Re-run the audit; nothing here may regress a gate.

## Acceptance

- No chapter reads as an empty screen with a paragraph stranded in it.
- All E06 gates still pass unchanged.
- Nothing animates that a reader did not trigger, except the single load moment.
