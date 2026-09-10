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

- [x] **E11-T1** — Chapter rhythm. Every chapter is currently `min-height: 100svh`
      with centred text, which makes short chapters read as voids. Vary the
      treatment by chapter weight.
- [x] **E11-T2** — Give the opening its own composition rather than being chapter
      zero in a uniform sequence.
- [x] **E11-T3** — §8 and §9 shift register from narrative to evidence; make that
      shift visible in the layout, not just the heading size.
- [ ] **E11-T4** — One orchestrated entrance moment on load. Not per-section
      fade-ups — SPEC.md rules those out explicitly.
- [x] **E11-T5** — Revisit §8 now that `/work` exists. **Removed entirely** on
      2026-09-11: the story is narrative only, the studio holds the projects.
      Nine chapters now, nine keyframes.

      **Cost, on the record:** Royal Class Group and the four-engineer ERP lead
      appeared only in §8 and now appear nowhere on the site. Copy is preserved in
      `src/content/work.ts`, which is no longer rendered.
- [x] **E11-T6** — Re-run the audit; nothing here may regress a gate.

## The diagnosis, and what was done

Yazan: *"the starting is vague and not obvious what is it talking about."* Correct,
and the pacing data backed it up: 744 words spread over nine full screens, with
the payoff at 100% in.

| Problem | Fix |
|---|---|
| Opening was a bare number with no place, time or stakes | Dateline, plus a promise paragraph naming the destination on screen one |
| Payoff (self-taught, no degree, Dubai) arrived last | Moved into the second paragraph of chapter 0 |
| Nine full screens for 744 words | Chapter height by word weight: 10131px → 7251px, 11.3 screens → 8.1 |
| Recommendations landed on a reader who had seen no work | A short bridge chapter naming the three systems, with a door to /work |
| Closed on a job advert | Pitch moved to the contact block; the story ends on the feeling |
| No sense of length | Rail ticks read past / current / ahead, so it works as a progress bar |

**Still open:** the dateline says `Latakia, Syria` with no year, because the year is
Yazan's to supply and it is the first fact a reader meets. One line in
`src/content/story.ts`.

## Acceptance

- No chapter reads as an empty screen with a paragraph stranded in it.
- All E06 gates still pass unchanged.
- Nothing animates that a reader did not trigger, except the single load moment.
