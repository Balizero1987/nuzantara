import { defineCollection, z } from 'astro:content';

// Article collection schema
const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    pillar: z.enum([
      'bali-reality',
      'expat-economy',
      'business-formation',
      'ai-tech',
      'trends-analysis',
    ]),
    tags: z.array(z.string()).default([]),
    author: z.string().default('Zero'),
    readTime: z.string(),
    featured: z.boolean().default(false),
    // RAG metadata
    ragGenerated: z.boolean().default(false),
    ragSources: z.array(z.string()).optional(),
    culturalContext: z.boolean().default(false),
  }),
});

export const collections = {
  articles,
};
