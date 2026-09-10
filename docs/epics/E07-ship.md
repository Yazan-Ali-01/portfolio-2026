# E07 — Performance, metadata, ship

**Goal:** the page paints fast, describes itself correctly when shared, and is live.

**Depends on:** all preceding epics.

## Why performance is a content requirement here

The spec puts it directly: a story about resilience that takes eight seconds to
paint undercuts itself. The lazy-loading architecture was chosen in E03/E04 to make
this achievable; this epic verifies it actually happened.

## Tasks

- [x] **E07-T1** — Bundle audit. Confirm three.js is in its own chunk, fetched only
      when the stage becomes visible, and absent from the initial document request.
- [x] **E07-T2** — Set and record a JS budget for first paint. The story text should
      need none of it.
- [x] **E07-T3** — Core Web Vitals on a throttled mobile profile, via
      `tools/perf.mjs` (slow 4G, 4x CPU, 390px). **FCP 508 ms, LCP 508 ms.** A full
      Lighthouse run still wants doing against the deployed URL; this measures the
      metrics that matter without pinning a score.
- [x] **E07-T4** — Font loading: confirm preload covers only above-the-fold faces
      and that fallback metrics avoid a visible reflow.
- [x] **E07-T5** — Metadata: title, description, canonical, `og:` and `twitter:`
      tags. The LinkedIn share card is the single most-seen surface of this site.
- [x] **E07-T6** — OG image. It should carry the opening line, not a generic name
      card.
- [x] **E07-T7** — `Person` structured data, matching the CV.
- [ ] **E07-T8** — Fact-check pass. Walk the `claims[]` array from E01-T2 and
      confirm each metric is still defensible in an interview. Confirm the §6/§7
      timeline still matches the CV.
- [ ] **E07-T9** — Deploy and custom domain. **Analytics is done** (see below).

## Analytics

Vercel Web Analytics, Vercel Speed Insights and Microsoft Clarity, all loaded on
`requestIdleCallback` so first paint is untouched. `src/lib/analytics.ts` is the
only place any of it lives.

**The gate's guarantee changed shape.** It used to ship zero executable JavaScript
and the audit asserted exactly that. It now ships a small deferred module, so the
assertion is "no render-blocking scripts": every executable script must be a
module or explicitly defer/async. LCP is unchanged.

**Analytics only run on the real site.** Three independent gates, added after
test traffic from the browser tooling reached Clarity before launch:

1. **Host allowlist** — `meta.analyticsHosts`. Localhost and preview deployments
   count nothing. This is the one that actually prevents the mistake.
2. **`navigator.webdriver`** — Playwright, Puppeteer and Selenium all set it.
3. **Request blocking in the tools** — `tools/_no-analytics.mjs` opts the browser
   out and aborts any beacon before it leaves the machine. Every browser tool
   imports it except `analytics-check.mjs`, whose job is to exercise the loader.

`?analytics=force` bypasses gates 1 and 2 for one tab so the loader can be tested
locally. It never beats self-exclusion, and it does not persist.

`audit.mjs` now asserts that a local run sends zero beacons, so this cannot
regress quietly.

**Self-exclusion** carries over from the old site: `?analytics=off` once on a
browser stops counting it, `?analytics=on` resumes. Stored in localStorage, so it
holds across the whole site.

Two things about that, since localStorage is scoped per origin and per browser:

- **Do it on the exact host you browse.** `analyticsHosts` lists both
  `yazan-ali.net` and `www.yazan-ali.net`. If both actually serve the site rather
  than one redirecting to the other, they are separate origins and each needs its
  own opt-out visit.
- **It is per browser profile.** Chrome, Safari and a phone each need their own
  opt-out, and a private window starts clean every time. Clearing site data wipes
  it too.

**Events, and the question each one answers:**

| Event | Question |
|---|---|
| `gate_choice` | Story or work? The gate is a bet on this |
| `story_depth` | Do readers finish ten chapters? Marks at opened, midway, reached the work, finished |
| `studio_used` | Is the 3D room earning its 130 KB, or do people take the index? |
| `note_open` | Does anyone read the mate and the books? |
| `artifact_open` | Which project pulls |
| `index_used` | Reached a project without touching the room |
| `case_outbound` | Clicks through to the live product or the source |
| `read_depth` | How far into a case study people get |
| `contact_click` | Email, LinkedIn, GitHub |

Verified by `node tools/analytics-check.mjs <url>`: nothing fetched before first
paint, everything fetched after idle, `gate_choice` carries its door, and the
opt-out switch genuinely suppresses every request and persists across pages.

**Clarity is on the old site's project id.** Point `meta.clarityId` at a new
project to keep this site's recordings separate, or set it to an empty string to
turn Clarity off.
- [x] **E07-T10** — README: what the site is, and why Astro rather than Next.js.
      The repo is a work sample; the reasoning is part of it.

## Results

Gzipped, from the production build:

| Asset | Size | When |
|---|---|---|
| `index.html` | 8.4 KB | immediately |
| CSS | 2.3 KB | immediately |
| JS | **0.9 KB** | immediately |
| 2 x Newsreader woff2 | 46 KB | preloaded |
| three.js | 129 KB | lazy, starts ~1.9 s after navigation |
| GSAP + ScrollTrigger | 44 KB | lazy, never fetched under reduced motion |
| Preact runtime | 4.4 KB | lazy |

**Font preloading was wrong and is fixed.** `<Font preload />` with no filter
preloads *every* file in the family — all four Newsreader variants, including both
italics, which appear once in chapter 3. Passing an explicit filter for the two
upright weights cut preloaded fonts from 136 KB to 46 KB.

**The OG card is a real page** (`src/pages/og.astro`, `noindex`) captured by
`tools/og.mjs`, so it can be regenerated when the copy changes. It carries the
opening line rather than a name card. Two traps worth remembering: the page does
not import `base.css`, so `box-sizing` has to be set locally or the padding lands
outside the 1200x630; and Astro scopes component `<style>`, so the dev toolbar
cannot be hidden from inside the page — the capture script removes the element.

## Acceptance

- First paint requires zero JavaScript.
- three.js is fetched only after the stage enters the viewport, confirmed in the
  network panel.
- Lighthouse performance and accessibility both above 95 on mobile throttling.
- The LinkedIn share preview renders correctly.
- Every metric on the page has been re-verified against its source.
