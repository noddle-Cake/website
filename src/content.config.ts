import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    /** Short product-style code shown in the minimal look, e.g. "IR-01". */
    code: z.string().optional().default(''),
    stack: z.array(z.string()),
    summary: z.string(),
    /** One-line pitch shown on the project's tile and card. */
    tagline: z.string().optional().default(''),
    /** The one figure or word the project is known by, set large on tiles without a screenshot. */
    highlight: z.object({ value: z.string(), label: z.string() }).optional(),
    github: z.string().optional().default(''),
    demo: z.string().optional().default(''),
    /** On-site page going deeper on the project, e.g. a before-and-after comparison. */
    caseStudy: z.string().optional().default(''),
    featured: z.boolean().default(false),
    order: z.number().default(100),
  }),
});

const courses = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/courses' }),
  schema: z.object({
    title: z.string(),
    topic: z.string(),
    summary: z.string(),
    status: z.enum(['planned', 'in-progress', 'live']).default('planned'),
    href: z.string().optional().default(''),
    order: z.number().default(100),
  }),
});

export const collections = {
  projects,
  courses,
};
