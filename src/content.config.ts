import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    stack: z.array(z.string()),
    summary: z.string(),
    github: z.string().optional().default(''),
    demo: z.string().optional().default(''),
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
