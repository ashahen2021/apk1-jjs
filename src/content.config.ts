import { defineCollection, reference, type ImageFunction } from 'astro:content';
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

/**
 * Media shared by every entity type. All fields are optional, so pages only
 * render the media blocks an entry actually has.
 *
 * Image paths are relative to the entry file and point into src/assets/media,
 * where Astro optimises them (AVIF/WebP, responsive sizes) at build time.
 */
const credit = {
  /** e.g. "Photo: Jane Doe" or "Reconstruction: NeoKemetAI". */
  credit: z.string().optional(),
  license: z.string().optional(),
  sourceUrl: z.url().optional(),
  /** Tells readers whether they are looking at evidence or an interpretation. */
  kind: z.enum(['photo', 'reconstruction', 'illustration', 'diagram']).default('photo'),
};

const media = (image: ImageFunction) => {
  const picture = z.object({
    src: image(),
    alt: z.string(),
    caption: z.string().optional(),
    ...credit,
  });
  return z
    .object({
      /** Featured image: page hero, cards and the social sharing image. */
      hero: picture.optional(),
      gallery: z.array(picture).default([]),
      /** Before/after sliders; both images should share the same framing. */
      compare: z
        .array(z.object({ before: picture.extend({ label: z.string() }), after: picture.extend({ label: z.string() }), caption: z.string().optional() }))
        .default([]),
      /** Interactive 3D model (GLB in public/models), loaded on demand. */
      model: z
        .object({
          src: z.string().regex(/^\/models\/.+\.glb$/),
          poster: image(),
          alt: z.string(),
          caption: z.string().optional(),
          ar: z.boolean().default(true),
          cameraOrbit: z.string().optional(),
          ...credit,
        })
        .optional(),
      /** 360° cylindrical panorama for monuments. */
      panorama: picture.optional(),
      /** 360° turntable: a folder of frames in src/assets/media/spins/<folder>/. */
      spin: z.object({ folder: z.string(), alt: z.string(), caption: z.string().optional(), ...credit }).optional(),
    })
    .prefault({});
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
  schema: ({ image }) => z.object({
    media: media(image),
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
  schema: ({ image }) => z.object({
    media: media(image),
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
  schema: ({ image }) => z.object({
    media: media(image),
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
  schema: ({ image }) => z.object({
    media: media(image),
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
  schema: ({ image }) => z.object({
    media: media(image),
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
  schema: ({ image }) => z.object({
    title: z.string().max(100),
    /** Optional local thumbnail; otherwise the YouTube thumbnail is used. */
    thumbnail: image().optional(),
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
