import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const caseStudies = defineCollection({
  loader: glob({ base: './src/content/case-studies', pattern: '**/*.md' }),
  schema: z.object({
    /** Matches the project id in src/content/projects.ts. */
    project: z.string(),
    title: z.string(),
    lede: z.string(),
    role: z.string(),
    period: z.string(),
    stack: z.array(z.string()),
    status: z.string(),
    liveUrl: z.string().url().optional(),
    sourceUrl: z.string().url().optional(),
    order: z.number(),
    /**
     * True when the technical detail is drafted rather than sourced from Yazan.
     * Nothing with this flag ships without his review.
     */
    needsReview: z.boolean().default(false),
  }),
});

export const collections = { caseStudies };
