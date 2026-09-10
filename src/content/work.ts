/**
 * NOT RENDERED. Section 8 was removed from the story on 2026-09-11; the projects
 * live in the studio at /work instead.
 *
 * Kept because two of these appear nowhere else on the site: Royal Class Group
 * (including the ~25% p95 latency work) and leading the four-engineer ERP team.
 * If either should be visible again, this is the copy, already fact-checked.
 *
 * Originally: section 8. Four blocks, restrained — SPEC.md rules out a card grid and a logo wall.
 *
 * `claims` isolates every checkable number on the page so they can be reviewed as a
 * set before publishing (E07-T8). Nothing goes in here that can't be defended in an
 * interview.
 */

export type WorkBlock = {
  id: string;
  org: string;
  period: string;
  body: string;
  claims: { metric: string; basis: string }[];
};

export const work: WorkBlock[] = [
  {
    id: 'royal-class',
    org: 'Royal Class Group',
    period: '2023–24',
    body: `Set the frontend architecture for Dubai’s open property and services marketplace. Rendering strategy, data fetching, where validation actually lives. I built the shared component library the other engineers worked from, and dragged a legacy Express HR system into a modular monolith along the way. Listing endpoints were slow, so I went digging: profiled the slow queries, indexed three expensive joins, retuned MySQL. p95 latency came down about 25%, checked against two weeks of production traffic.`,
    claims: [
      {
        metric: `~25% reduction in p95 latency on listing endpoints`,
        basis: `Profiled slow queries, indexed three expensive joins, retuned MySQL. Verified against two weeks of production traffic.`,
      },
    ],
  },
  {
    id: 'driven',
    org: 'Driven | Forbes Global Properties',
    period: '2024–present',
    body: `Property search was broken, and the trail led to two competing sources of truth: location paths pulling one way, query refinements pulling another. I replaced both with a single contract. Organic sessions to search pages climbed 7% inside three weeks. I also designed the canonical, SEO-first URL hierarchy for Dubai real estate, mapping inventory cleanly from city right down to sub-community and killing off the duplicate paths. Core listing pages moved up two full pages in Google within the first month.`,
    claims: [
      {
        metric: `7% rise in organic sessions to search pages, in three weeks`,
        basis: `Replaced two competing sources of truth between location paths and query refinements with a single contract.`,
      },
      {
        metric: `Core listing pages moved up two full pages in Google within a month`,
        basis: `Canonical SEO-first URL hierarchy, city down to sub-community, duplicate paths removed.`,
      },
    ],
  },
  {
    id: 'erp-team',
    org: 'Leading a team',
    period: '',
    body: `Laid the founding architecture for a new ERP platform meant to be resold as a product. NestJS, PostgreSQL, Redis, BullMQ, Docker, AWS, Terraform, GitHub Actions. Then I hired the four engineers who built it and led them, setting the event-driven design, the environments, and the CI/CD foundation they worked against.`,
    claims: [
      { metric: `Hired and led four engineers`, basis: `Founding architecture and team for a resellable ERP platform.` },
    ],
  },
  {
    id: 'jeem',
    org: 'Jeem',
    period: 'contract',
    body: `Led the full frontend rewrite of a legacy Next.js Pages Router app onto Next.js 15, rebuilt around clean boundaries between UI, business logic, and data access. It’s an AI chat product for the MENA region, which means streaming interactions, heavy dynamic state, and a CSS architecture that had to survive both at once.`,
    claims: [],
  },
];
