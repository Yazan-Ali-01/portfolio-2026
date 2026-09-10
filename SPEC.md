# Portfolio Story Spec — Yazan Ali

A scroll-driven narrative portfolio. Ten sections. Copy below is a working draft in your voice — edit freely, but the structure is load-bearing.

**Through-line:** *A door closed by a number, and every year after spent building doors that open by hand.*

---

## The scene (background 3D layer)

One continuous object across the whole scroll, not a new effect per section. Suggestion: concentric rings in dark space with a single warm point of light at the center.

The light starts far away and small. Each chapter draws it closer. By the final section it is steady, near, and the rings have settled level. Nothing else on the page moves on its own.

Two rules worth enforcing in the build:
- The scene reacts to scroll position only. No autoplay loops, no per-card hover animations.
- `prefers-reduced-motion` gets a static composition and the full text. The story has to survive without the 3D.

---

## 1 — Opening

> **Eighty-three percent.**
>
> That was my score, and it wasn't enough. Not because I couldn't do the work — because too many people had applied for the same seats, and the cutoff went to whoever scored highest.
>
> I wanted computer science. I got electrical engineering.

*Scene: light distant, rings wide and cold.*

**Info badge — expandable, placed beside this section:**

> In Syria, university admission runs on a preference list. You submit around ten choices, and a cutoff score is set for each major based on grades, applicant volume, and available seats.
>
> Computer science is over-subscribed for cultural reasons as much as academic ones — families push their children toward it as the safe, prestigious choice, often without much sense of whether it fits. The seats go to the highest scores among everyone who applied. The cutoff isn't a judgment of you. It's arithmetic.

---

## 2 — Aleppo

> I was eighteen and picked electrical engineering because it had "electric" in the name and felt adjacent to technology. That was the whole reasoning.
>
> It was also the only engineering my score could reach — and I couldn't study it in Latakia. So I spent my first year in Aleppo, in another city, working around the admission rules to get into engineering at all, planning to transfer home after.
>
> On weekends I'd open a CS course for an hour or two. I found CS50. I didn't take it seriously. It was a hobby I kept next to the thing I was actually enrolled in.

*Scene: rings tilt off-axis. Light unchanged.*

---

## 3 — The room

> I transferred back to Latakia in my second year, and something settled: **I was not going to be an illiterate engineer.**
>
> That was the phrase in my head. Not "I want to switch careers." Something closer to refusing to spend four years earning a title I'd be hollow inside.
>
> So I lived alone and built a second schedule underneath the first one. University during the day. Udemy courses and YouTube at night, before sleep. No bootcamp, no cohort, no one checking whether I'd shown up.
>
> I'd wanted CS since before I knew what it was — I liked logic, I liked philosophy, and I had a feeling that all the complex machinery I saw in films had to run on reasoning and arguable decisions underneath. I finally went to look.

*Scene: rings begin to align. Light takes its first step closer.*

---

## 4 — The message

> Six months in, a DM on LinkedIn.
>
> I prepared hard, did the interview, and got my first remote job. The market was kinder then than it is now — I won't pretend otherwise. But I was ready when it arrived, and that part wasn't luck.
>
> Then I made the decision that actually cost something: I left university. Not paused. Left.
>
> My family fought me on it. They're traditional, and a degree is not a small thing to walk away from — that reaction was fair. But I knew I was never going to be an electrical engineer, and I trusted what I could already see myself becoming. I've never gone back. I still don't have the degree.

*Scene: light closer. Rings hold steady for the first time.*

---

## 5 — The ceiling

> By 2023, Syria had become a ceiling rather than a home base.
>
> Electricity ran four to six hours a day. Receiving payment for freelance work was its own engineering problem. Whole categories of opportunity were closed to me for one reason: where I was.
>
> And past the logistics, the ambition wasn't being met. I wanted work that would force me to get better, and I wasn't going to find it from there.

*Scene: rings widen — the space opens up before the move.*

---

## 6 — Dubai, with nothing

> I moved to Dubai with zero connections and no real knowledge of the market. I'll be honest: I didn't study it. I gambled. I did the whole thing in a rush.
>
> I still think moving before you can talk yourself out of it is underrated.
>
> A month of hunting, and I landed a contract. I asked them to adjust one clause. They said they'd come back in two days. What came back was that they'd hired someone else.
>
> That put me at zero, in a city where I didn't know anyone.

*Scene: the light drops back and dims. The one reversal in the whole sequence — let it hurt.*

---

## 7 — Back up

> Another month of hunting, funded by freelance work and whatever side income I could assemble.
>
> Then an offer that paid less than I wanted, attached to an opportunity worth more than the number. I took it on purpose. That trade has paid for everything since.

*Scene: light recovers past its previous position. Rings level out.*

---

## 8 — What I've built

Four blocks — restrained, no card grid, no logo wall.

**Royal Class Group — 2023–24**
Defined the frontend architecture for Dubai's open property and services marketplace: rendering strategy, data fetching, validation boundaries. Built the shared component library the other engineers worked from. Refactored a legacy Express HR system into a modular monolith. Cut p95 latency on listing endpoints by about 25% by profiling slow queries, indexing three expensive joins, and retuning MySQL — verified against two weeks of production traffic.

**Driven | Forbes Global Properties — 2024–present**
Rebuilt property search after tracing broken filtering to two competing sources of truth between location paths and query refinements, and replacing both with a single contract — organic sessions to search pages rose 7% in three weeks. Designed the canonical SEO-first URL hierarchy for Dubai real estate, mapping inventory cleanly from city down to sub-community and killing the duplicate paths; core listing pages moved up two full pages in Google within a month.

**Leading a team**
Established the founding architecture for a new ERP platform intended as a resellable product — NestJS, PostgreSQL, Redis, BullMQ, Docker, AWS, Terraform, GitHub Actions — then hired and led the four engineers who built it, defining the event-driven design, environments, and CI/CD foundation.

**Jeem — contract**
Led the complete frontend rewrite of a legacy Next.js Pages Router application to Next.js 15, rebuilding it around clear boundaries between UI, business logic, and data access. An AI chat product built for the MENA region — streaming interactions, heavy dynamic state, and a CSS architecture that had to hold up under both.

*Scene: nearly still. The work speaks; the background gets out of the way.*

---

## 9 — What they say

Two recommendations, given room to be read. No carousel, no auto-rotation.

### Luis Beltran

> Yazan is an exceptionally hard-working and self-driven individual who consistently demonstrates a rare combination of technical depth and business knowledge. He approaches every project with a clear sense of purpose and precision, balancing technical excellence with a mature understanding of business objectives. Yazan's decisions are always thoughtful and well-guided, and his pursuit of perfection ensures that every deliverable meets the highest standards. Beyond his individual strengths, he is also highly collaborative — always open to feedback, ready to support others, and genuinely invested in collective success.
>
> On a personal level, Yazan is a truly pleasant colleague to work with. He is friendly, approachable, and brings a good sense of humor that helps create a positive and balanced work environment.

Chief Marketing Officer, Driven | Forbes Global Properties. Managed Yazan directly. October 2025.

*Editorial note:* the opening paragraph ("I had the pleasure of working with Yazan during our time at Driven | Forbes Global Properties, where he served as Principal Software Engineer") is cut rather than reworded. That removes the Principal/Senior title mismatch without altering anyone's words — the byline carries the attribution instead. The closing paragraph ("Working with Yazan was a privilege...") is cut as boilerplate. Full verbatim text is kept in the data file.

### Mohamed Arab

> Yazan's resilience and ability to transform every challenge into an opportunity are unparalleled. Yazan is a fearless risk-taker, always ready with insightful questions to ensure every move is strategic and effective. In him, you'll find a team member who exceeds expectations and propels any team to new heights.

Founder & CEO, BeIn Media. Managed Yazan directly. September 2023.

Used in full, unedited. Given everything above it on the page, this one lands hard. Let it sit alone.

---

## 10 — Now

> Six years in, self-taught, no degree, and still learning every day — not as a virtue, as a job requirement.
>
> I'm looking for work with real ownership: end to end, on a system that's actually interesting, where the technical decisions are mine to make and defend. Senior, lead, the title matters less than whether the work pushes me.
>
> That's the whole reason I became a software engineer. It's still the reason.

Contact: email, LinkedIn, GitHub. Plain links, no form.

*Scene: light arrives at the front, steady. Rings level. Motion stops.*

---

## Build notes

**Stack:** Next.js + GSAP ScrollTrigger for scroll binding, three.js for the scene. React Three Fiber if you want the scene declarative alongside the content.

**Non-negotiables:**
- The full story must be readable with JavaScript disabled and with reduced motion on. The 3D is the frame, not the content.
- Lazy-load the three.js bundle. A story about resilience that takes eight seconds to paint undercuts itself.
- Mobile: the scene simplifies rather than disappears. Most people will read this on a phone from a LinkedIn tap.
- Every claim on the page is checkable — the 7%, the two pages, the 25%. Keep it that way.

**Timeline (settled):** BeIn Media ends Feb 2023, Royal Class starts Apr 2023 — a two-month gap. Sections 6 and 7 are written as one month of hunting, the lost contract, then another month. The story now matches the CV; keep it that way if either is edited.
