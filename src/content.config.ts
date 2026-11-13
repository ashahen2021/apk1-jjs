import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Years are signed integers: negative = BCE, positive = CE.
 * All dates follow the conventional (Shaw, Oxford History of Ancient Egypt)
 * chronology and are approximate before the Late Period.
 */
const year = z.number().int();

const seo = {
  /** Overrides the auto-generated meta description. */
  description: z.string().max(170),
  /** Optional Open Graph image path under /public. */
  image: z.string().optional(),
};

const periods = defineCollection({
  loader: file('src/data/periods.yaml'),
  schema: z.object({
    name: z.string(),
    start: year,
    end: year,
    color: z.string(),
    summary: z.string(),
  }),
});

const dynasties = defineCollection({
  loader: file('src/data/dynasties.yaml'),
  schema: z.object({
    number: z.number().int().min(1).max(31),
    name: z.string(),
    period: reference('periods'),
    start: year,
    end: year,
    capital: z.string(),
    rulers: z.array(z.string()),
    summary: z.string(),
  }),
});

const pharaohs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pharaohs' }),
  schema: z.object({
    name: z.string(),
    throneName: z.string().optional(),
    epithet: z.string().optional(),
    dynasty: reference('dynasties'),
    reignStart: year,
    reignEnd: year,
    highlights: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    ...seo,
  }),
});

const place = {
  site: z.string(),
  coordinates: z.tuple([z.number(), z.number()]).optional(),
};

const monuments = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/monuments' }),
  schema: z.object({
    name: z.string(),
    type: z.enum(['pyramid', 'temple', 'mortuary temple', 'rock-cut temple', 'sphinx', 'obelisk', 'city']),
    ...place,
    built: year,
    pharaohs: z.array(reference('pharaohs')).default([]),
    unesco: z.string().optional(),
    featured: z.boolean().default(false),
    ...seo,
  }),
});

const tombs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tombs' }),
  schema: z.object({
    name: z.string(),
    code: z.string().optional(),
    owner: z.string(),
    pharaoh: reference('pharaohs').optional(),
    dynasty: reference('dynasties'),
    ...place,
    discovered: z.object({ year: year, by: z.string() }).optional(),
    ...seo,
  }),
});

const artifacts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/artifacts' }),
  schema: z.object({
    name: z.string(),
    material: z.string(),
    dimensions: z.string().optional(),
    dynasty: reference('dynasties'),
    pharaoh: reference('pharaohs').optional(),
    tomb: reference('tombs').optional(),
    foundAt: z.string(),
    museum: z.string(),
    ...seo,
  }),
});

const videos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/videos' }),
  schema: z.object({
    title: z.string().max(100),
    /** YouTube video ID. Leave empty for announced / in-production videos. */
    youtubeId: z.string().optional(),
    published: z.coerce.date().optional(),
    /** ISO 8601 duration, e.g. PT24M30S. */
    duration: z.string().optional(),
    format: z.enum(['documentary', 'sleep', 'reference', 'short']),
    playlist: z.enum(['sleep-documentaries', 'ancient-engineering', 'gods-and-myths', 'archaeological-discoveries']),
    chapters: z.array(z.object({ time: z.string(), title: z.string() })).default([]),
    pharaohs: z.array(reference('pharaohs')).default([]),
    monuments: z.array(reference('monuments')).default([]),
    tombs: z.array(reference('tombs')).default([]),
    artifacts: z.array(reference('artifacts')).default([]),
    dynasties: z.array(reference('dynasties')).default([]),
    ...seo,
  }),
});

export const collections = { periods, dynasties, pharaohs, monuments, tombs, artifacts, videos };
