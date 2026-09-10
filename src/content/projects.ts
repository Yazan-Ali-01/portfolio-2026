/**
 * The three projects in the studio. One object each.
 *
 * `artifact` decides what sits on the desk: a screen showing the real product,
 * or a drawing. Complytude is backend-only, which is why its artifact is a
 * diagram — in an architect's studio that is not a consolation prize.
 */

export type Project = {
  id: string;
  name: string;
  proposition: string;
  role: string;
  period: string;
  status: string;
  liveUrl?: string;
  sourceUrl?: string;
  artifact: {
    kind: 'screen' | 'diagram';
    src: string;
    alt: string;
    /** Shown under the figure. The alt text is for screen readers, not display. */
    caption: string;
  };
};

export const projects: Project[] = [
  {
    id: 'driven',
    name: 'Driven Properties',
    proposition: 'A property search that did not filter, rebuilt around one canonical hierarchy.',
    role: 'Senior engineer, rebuild lead',
    period: '2024–present',
    status: 'Live in production',
    liveUrl: 'https://www.drivenproperties.com/properties-for-sale-in-dubai',
    artifact: {
      kind: 'screen',
      src: '/work/driven-listings.png',
      alt: 'The rebuilt Driven Properties listings page: filter bar, property type facets, and 11,038 results.',
      caption:
        'The rebuilt search, live. One canonical URL, one filtering contract, 11,038 listings behind it.',
    },
  },
  {
    id: 'complytude',
    name: 'Complytude',
    proposition: 'Multi-tenant legal-compliance SaaS, isolated at the database and on the queue.',
    role: 'Founder, lead engineer and architect',
    period: 'Side project',
    status: 'Backend ~80%, paused deliberately, source public',
    sourceUrl: 'https://github.com/Yazan-Ali-01/complytude-backend',
    artifact: {
      kind: 'diagram',
      src: '/work/complytude-architecture.svg',
      alt: 'Architecture diagram: client requests hit a Fastify API with row-level security, which enqueues heavy work onto BullMQ over Redis; ingestion and AI workers consume the queue using tenant-isolated S3 storage, a legal-text retrieval corpus, and Anthropic and OpenAI providers.',
      caption:
        'The request path stays synchronous and fast. Generation and analysis run asynchronously on isolated workers. Accent lines trace the AI path.',
    },
  },
  {
    id: 'jeem',
    name: 'Jeem',
    proposition: 'The frontend of an Arabic AI answer engine, rebuilt around streaming.',
    role: 'Frontend engineer, rewrite lead',
    period: 'Contract',
    status: 'Live in beta',
    liveUrl: 'https://jeem.ai/',
    artifact: {
      kind: 'screen',
      src: '/work/jeem-answer.png',
      alt: 'Jeem answering a question: collapsible thinking steps, streamed prose with inline citations, and a rendered comparison table with copy, download and expand actions.',
      caption:
        'One answer, mid-stream: thinking steps, cited prose, and a table that has to render progressively and then settle.',
    },
  },
];
