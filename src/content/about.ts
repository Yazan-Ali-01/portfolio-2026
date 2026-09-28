/* ---------------------------------------------------------------------------
   The corpus behind /ask.

   Facts, not voice. Each entry is something Yazan said in interview or that is
   on his CV, written plainly; the system prompt supplies the colleague's tone.
   Keeping the two apart means the voice can change without rewriting sixty
   facts, and it means every sentence the bot says traces to a line here.

   `id` is what the model cites. `source` is where a reader can go and check.
   Nothing goes in without a source or a direct quote from him: if it is not
   here, the bot says it does not know.
   --------------------------------------------------------------------------- */

export type Fact = {
  id: string;
  topic: string;
  text: string;
  source?: { label: string; href: string };
};

export const about: Fact[] = [
  // --- where he is now ----------------------------------------------------
  {
    id: 'now',
    topic: 'availability',
    text: `Between full-time roles. He left Driven | Forbes Global Properties in May 2026 after two years. He mentors at TAP, an organisation supporting Palestinian talent, and takes small freelance work while he looks for the right senior role. He is actively looking and available now.`,
  },
  {
    id: 'looking-for',
    topic: 'availability',
    text: `Open to senior roles, remote anywhere or on-site in Dubai. Open on domain, open on early-stage or established. He prefers small teams but will work in either. What he wants is ownership: of the product, of the architecture, and of tech-stack decisions. He describes building something greenfield, from scratch, as the version he would most like. The one non-negotiable is learning something new every day.`,
    source: { label: 'The work', href: '/work' },
  },
  {
    id: 'not-wanted',
    topic: 'availability',
    text: `He would turn down a role with no respect for software quality. He is explicit that this is not about demanding high standards everywhere: he understands trade-offs and is willing to take them. What he will not accept is a place where he stops growing as an engineer.`,
  },

  // --- the question every recruiter opens with ----------------------------
  {
    id: 'shape',
    topic: 'range',
    text: `Full-stack, and the split is not the obvious one. His backend work is mostly TypeScript, not Python: NestJS and Fastify at Complytude, NestJS microservices on the ERP platform, Node and Express at Royal Class. That is the same language he writes frontends in, which is why calling him a frontend engineer who dabbles in backend gets it wrong. Python is his second backend language, used in production at Driven and BeIn with FastAPI, SQLAlchemy and Pydantic. On the frontend he works in React and Next.js in both routers. He has taken systems from an empty repository to production and owned the architecture, the data model and the deployment for them.`,
  },

  // --- how he works -------------------------------------------------------
  {
    id: 'whole-request',
    topic: 'how he works',
    text: `He does not treat frontend architecture as stopping at the browser. If the user experience depends on an API or a database, he investigates the whole request lifecycle rather than optimising only the part he owns. This is how the Royal Class latency work started: he was hired for frontend architecture and found the delay was not in rendering.`,
    source: { label: 'The work', href: '/work' },
  },
  {
    id: 'disagreement',
    topic: 'how he works',
    text: `On complex architecture disagreements he goes to a whiteboard and works it out in the open. He gives up some of his ideas, the other person gives up some of theirs, and what comes out is usually better than either started with. He treats that as the normal outcome rather than a compromise.`,
  },
  {
    id: 'diagnose-first',
    topic: 'how he works',
    text: `He diagnoses before he proposes, and he writes it down. At Driven he spent his first week reading the codebase and producing written diagnostic reports for his manager, itemising what he had found, before asking to change anything.`,
    source: { label: 'Driven Properties', href: '/work/driven' },
  },
  {
    id: 'hiring-view',
    topic: 'how he works',
    text: `When he hired the four ERP engineers he interviewed for thinking rather than stack: system design conversations and reviews, not trivia. He weighs behaviour as heavily as technical ability.`,
  },

  // --- the Driven rebuild, in his words -----------------------------------
  {
    id: 'driven-why-hired',
    topic: 'Driven',
    text: `He was hired at Driven partly because search filtering was broken and partly because the previous engineer had left and day-to-day work needed an owner. The codebase had been built by a non-technical project manager and had grown large.`,
    source: { label: 'Driven Properties', href: '/work/driven' },
  },
  {
    id: 'driven-patch-cycle',
    topic: 'Driven',
    text: `Before he arrived the site was maintained by patching. The CEO would report a problem, someone would fix that specific symptom, the fix would break something else, and the CEO would find that later. Everyone knew about it and the cycle continued.`,
    source: { label: 'Driven Properties', href: '/work/driven' },
  },
  {
    id: 'driven-diagnosis',
    topic: 'Driven',
    text: `What he found in the first week: location segments that should have been dynamic were hardcoded into the codebase, caching behaved differently from page to page with no consistency, filtering logic was hardcoded, and listings were split between the CRM and Sanity with no single source of truth.`,
    source: { label: 'Driven Properties', href: '/work/driven' },
  },
  {
    id: 'driven-convincing',
    topic: 'Driven',
    text: `Getting permission to rebuild rather than patch took convincing his manager first, then the CEO directly, while the SEO team argued against it and warned the CEO that a rebuild would cost them reach. He made the case with written evidence and it went ahead.`,
    source: { label: 'Driven Properties', href: '/work/driven' },
  },

  // --- leadership, including the cost -------------------------------------
  {
    id: 'erp-team',
    topic: 'leadership',
    text: `At Driven he set the founding architecture for a new ERP platform intended to be resold as a product, built as NestJS and Python microservices, then hired four engineers and led them, defining the event-driven design, the environments and the CI/CD foundation.`,
  },
  {
    id: 'leading-cost',
    topic: 'leadership',
    text: `He is direct about what leading cost him: roughly 50 to 60 percent of his coding time went to tickets, coordination, moving context between people and code review. He describes managing a team of four as a new skill he was learning at the time.`,
  },

  // --- honest limits ------------------------------------------------------
  {
    id: 'python-level',
    topic: 'limits',
    text: `He ships production Python, including FastAPI services at Driven and at BeIn Media, but TypeScript is his first language and he will tell you that himself when asked.`,
  },
  {
    id: 'kubernetes',
    topic: 'limits',
    text: `He is preparing for the Certified Kubernetes Application Developer exam, working through the practice tests. He has not shipped Kubernetes in production and does not claim to have.`,
  },
  {
    id: 'no-degree',
    topic: 'background',
    text: `He is self-taught and takes pride in it. He left university deliberately rather than failing out; the story page covers why. He says it has never cost him an interview.`,
    source: { label: 'The story', href: '/story' },
  },


  // --- employment, from the CV --------------------------------------------
  {
    id: 'role-driven',
    topic: 'employment',
    text: `Senior Software Engineer at Driven | Forbes Global Properties, May 2024 to May 2026. He rebuilt the property search, designed a canonical SEO-first URL hierarchy for Dubai real estate mapping inventory from city down to sub-community, and unified CMS and database access behind one interface with server-side rendering, caching and prefetching layered on top. Organic sessions to search pages rose 7 percent in the three weeks after launch, and core listing pages moved up two full pages in Google within the first month. Stack: Python with FastAPI, SQLAlchemy and Pydantic, TypeScript, NestJS, Next.js, PostgreSQL, Redis, BullMQ, Docker, AWS, Terraform, GitHub Actions.`,
    source: { label: 'Driven Properties', href: '/work/driven' },
  },
  {
    id: 'role-royal-class',
    topic: 'employment',
    text: `Senior Software Engineer at Royal Class Group, April 2023 to March 2024. He defined the frontend architecture for Dubai's open property and services marketplace, set the server-side versus client-side rendering strategy, and guided engineers on data fetching, validation and rendering boundaries. He built a reusable component library and the shared conventions for typed data fetching and schema validation. Stack: TypeScript, Next.js, TanStack Query, Zod, Node.js, Express, MySQL.`,
  },
  {
    id: 'royal-class-latency',
    topic: 'employment',
    text: `The Royal Class latency work started outside his brief. Working on listing pages he noticed the delay was not coming from rendering but from how long data took to arrive. He profiled the requests, traced the response times to slow database queries, then coordinated with the team who owned the database before changing anything, explained what he had found and agreed the optimisations with them. Three high-cost joins got composite indexes and MySQL was retuned. p95 latency on listing endpoints came down about 25 percent, verified against two weeks of production traffic.`,
  },
  {
    id: 'role-bein',
    topic: 'employment',
    text: `Full Stack Developer at BeIn Media, Nmo AI, November 2021 to February 2023. He restructured the React codebase around feature-based modules with shared components and hooks, shipped features end to end including Python backend services, and introduced CI/CD and automated testing, taking the team from manual release checks to a suite gating every deploy. Stack: Python with FastAPI, SQLAlchemy and Pydantic, React, Azure DevOps, Cypress, Jest, Mocha.`,
  },
  {
    id: 'role-osous',
    topic: 'employment',
    text: `Frontend Web Developer at Osous Technology LLC, April 2020 to September 2021. His first role: responsive, user-focused interfaces, working closely with backend engineers on integration and consistency.`,
  },
  {
    id: 'experience-span',
    topic: 'employment',
    text: `Six years of professional experience, from April 2020 to May 2026, across four employers, with the last three years at senior level and deep exposure to Dubai real estate technology.`,
  },

  // --- Jeem ---------------------------------------------------------------
  {
    id: 'jeem',
    topic: 'Jeem',
    text: `A contract engagement with Jeem, an Arabic AI answer engine formerly called Fyler. He led the complete frontend rewrite of a legacy Next.js Pages Router application onto Next.js 15, rebuilt around clear boundaries between UI, business logic and data access, and defined improved v2 API contracts with the Python backend team.`,
    source: { label: 'Jeem', href: '/work/jeem' },
  },
  {
    id: 'jeem-streaming',
    topic: 'Jeem',
    text: `The hard part of Jeem was streaming. He designed the render strategy for answers arriving over Server-Sent Events, controlling in one place how often the UI catches up with the token stream, and rendering partial Markdown including tables and citations progressively without flicker. He also built a CSS system for bidirectional Arabic and English content with light and dark theming, so new answer blocks inherit the right direction, spacing and state instead of needing special cases.`,
    source: { label: 'Jeem', href: '/work/jeem' },
  },

  // --- Complytude, the architecture ---------------------------------------
  {
    id: 'complytude-architecture',
    topic: 'Complytude',
    text: `Complytude is a multi-tenant legal compliance SaaS for UAE businesses, his own side project, where he owned the backend architecture end to end. Tenant isolation is enforced at the database with PostgreSQL row-level security and a tenant-scoped session context rather than by developers remembering a filter. Auth uses a dual-token flow separating who you are from which tenant you are acting in. Generation and analysis run as an event-driven pipeline over job queues, using retrieval-augmented generation over UAE legal source material with both Anthropic and OpenAI. He set the standards the team built to: roughly 80 percent unit-test coverage, CI gating lint, types and tests, structured logging across request and worker paths, and three local environments.`,
    source: { label: 'Complytude', href: '/work/complytude' },
  },

  // --- skills and credentials ---------------------------------------------
  {
    id: 'skills',
    topic: 'skills',
    text: `Languages: TypeScript, JavaScript, Python, SQL. Backend: Node.js, NestJS, Express, Fastify, FastAPI, REST APIs, BullMQ, event-driven architecture. Frontend: React, Next.js in both App and Pages Router, TanStack Query, Zod, Tailwind, Shadcn/UI, Material-UI, Framer Motion. Data: PostgreSQL including row-level security, MySQL, MongoDB, Redis. Cloud and DevOps: AWS, Docker, Terraform, GitHub Actions, Azure DevOps, CI/CD. Testing: Jest, Cypress, Playwright, Mocha. AI: RAG pipelines, Anthropic and OpenAI API integration, Cursor, Claude Code.`,
  },
  {
    id: 'credentials',
    topic: 'skills',
    text: `AWS Certified Solutions Architect, Associate. Fundamentals of Database Engineering. Currently preparing for the Certified Kubernetes Application Developer exam. No university degree.`,
  },
  {
    id: 'languages',
    topic: 'background',
    text: `Arabic is his native language, English is professional level, and he has basic Spanish. He is Syrian, from Latakia, and based in Dubai.`,
    source: { label: 'The story', href: '/story' },
  },

  // --- the one that has to carry weight without sounding like a pitch -----
  {
    id: 'differentiator',
    topic: 'why him',
    text: `Asked what separates him from another senior engineer with the same stack list, he does not answer with skills. He answers with ownership: he takes a problem as his and sees it through, including where that was uncomfortable. He argued the Driven rebuild past an SEO team who were telling the CEO it would cost them reach, and at Royal Class he went outside his brief to find latency nobody had asked him to look for. He is self-taught and treats that as a strength. He keeps learning on purpose rather than for show: AWS Solutions Architect Associate recently, Kubernetes now. He has sat with founders and CEOs and had to convince them, and he still writes the code.`,
  },

  // --- Complytude, told properly ------------------------------------------
  {
    id: 'complytude-stopped',
    topic: 'Complytude',
    text: `He stopped Complytude on purpose after validating the idea and finding it did not hold. Looking into the regulations showed it needed a partnership with a legal firm, which does not fit the direction he is taking. He had already proven the architecture he set out to prove. It is not an unfinished project he drifted away from; it is one he chose to stop.`,
    source: { label: 'Complytude', href: '/work/complytude' },
  },
];

/** Flat list of ids, so the prompt can tell the model exactly what it may cite. */
export const factIds = about.map((f) => f.id);
