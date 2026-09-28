export const meta = {
  name: 'Yazan Ali',
  role: 'Software Engineer',
  location: 'Dubai',
  email: 'yazan.ali.dev@gmail.com',
  linkedin: 'https://www.linkedin.com/in/yazan-ali/',
  github: 'https://github.com/Yazan-Ali-01',
  /*
   * These two are the search result, not the page. The gate keeps its own
   * headline; this is the line a recruiter scans in a list of ten results, so
   * it has to carry seniority, the span of the work, the stack and the city.
   * The previous description read well on the page and said none of those.
   */
  title: 'Yazan Ali — Senior Software Engineer, Dubai',
  description: `Senior full-stack engineer in Dubai. I build web products end to end, from React and Next.js frontends to multi-tenant NestJS and PostgreSQL backends.`,
  lang: 'en',
  /** Taken from the existing site's structured data. Change if the domain moves. */
  siteUrl: 'https://www.yazan-ali.net',
  ogImage: '/og.jpg',
  /**
   * Microsoft Clarity project. This is the id the current yazan-ali.net uses;
   * point it at a NEW project if you want this site's recordings kept separate
   * from the old one's. Empty string disables Clarity entirely.
   */
  clarityId: 'ygcey64pbp',
  /**
   * Analytics run on these hosts and nowhere else. Not localhost, not preview
   * deployments, not a headless browser. Exact matches only.
   */
  analyticsHosts: ['yazan-ali.net', 'www.yazan-ali.net'],
  credential: 'AWS Certified Solutions Architect, Associate',
  knowsAbout: [
    'Multi-tenant architecture',
    'Event-driven systems',
    'PostgreSQL',
    'Distributed systems',
    'NestJS',
    'TypeScript',
    'Next.js',
    'AWS',
    'SEO architecture',
  ],
} as const;
