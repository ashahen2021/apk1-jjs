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
  /**
   * Tells readers whether they are looking at evidence or an interpretation:
   * photo = documented evidence · diagram = measured/schematic drawing ·
   * reconstruction = visual reconstruction · model = interpretive 3D model.
   */
  kind: z.enum(['photo', 'diagram', 'reconstruction', 'model', 'illustration']).default('photo'),
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
      /** Architectural plan (src/data/plans/<id>.yaml): drives the chamber map, depth profile and 3D hotspots. */
      plan: reference('plans').optional(),
      /** Featured film for this page, optionally starting at a chapter. */
      video: z
        .object({ ref: reference('videos'), start: z.string().regex(/^\d+(:\d{2}){1,2}$/).optional(), note: z.string().optional() })
        .optional(),
    })
    .prefault({});
};

/**
 * Architectural plans of tombs (and later other buildings), in metres.
 * Plan coordinates: x to the right, y down the page; depths are negative.
 * Every space carries an evidence status so the site never presents an
 * approximation as a measured fact.
 */
const status = z.enum(['documented', 'approximate', 'uncertain']);
const range = z.tuple([z.number(), z.number()]);
const plans = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/data/plans' }),
  schema: z.object({
    title: z.string(),
    /** Where the layout comes from, shown under every plan and model. */
    source: z.string(),
    note: z.string().optional(),
    /** Published overall figures, when known. */
    length: z.number().optional(),
    area: z.number().optional(),
    /** Default 3D camera angles (degrees), shared by the poster render and the viewer. */
    camera: z.object({ theta: z.number(), phi: z.number() }).default({ theta: 35, phi: 52 }),
    spaces: z.array(
      z.object({
        id: z.string(),
        /** Short label on the plan and 3D hotspots, e.g. "1" or "J". */
        code: z.string(),
        name: z.string(),
        kind: z.enum(['stairs', 'corridor', 'chamber', 'hall', 'well', 'annex', 'crypt', 'tunnel']),
        x: range,
        y: range,
        /** Floor depth at the start and end of the space (equal when flat). */
        floor: range,
        /** Direction the floor descends in plan: x+, x-, y+ or y-. */
        descends: z.enum(['x+', 'x-', 'y+', 'y-']).optional(),
        height: z.number(),
        pillars: z.array(z.tuple([z.number(), z.number()])).default([]),
        pillarSize: z.number().default(1.1),
        /** Walls carrying painted or carved decoration: n (top), e (right), s (bottom), w (left). */
        decorated: z.array(z.enum(['n', 'e', 's', 'w'])).default([]),
        decoratedPillars: z.boolean().default(false),
        /** Shaft in the floor of a well chamber. */
        pit: z.object({ x: range, y: range, depth: z.number() }).optional(),
        sarcophagus: z
          .object({
            x: z.number(),
            y: z.number(),
            w: z.number(),
            d: z.number(),
            h: z.number(),
            material: z.enum(['quartzite', 'granite', 'calcite']),
            /** in-situ = still in the tomb; removed = now elsewhere; lost = only fragments or records survive. */
            state: z.enum(['in-situ', 'removed', 'lost']),
            label: z.string(),
          })
          .optional(),
        summary: z.string(),
        decoration: z.string().optional(),
        status,
        /** Why the status is not "documented", or other caveats. */
        caveat: z.string().optional(),
        /** Notable scenes, shown as hotspots on the wall they occupy. */
        scenes: z
          .array(z.object({ id: z.string(), wall: z.enum(['n', 'e', 's', 'w']), title: z.string(), text: z.string(), status: status.default('documented') }))
          .default([]),
      }),
    ),
  }),
});

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
    valley: z.enum(['kings', 'queens']).optional(),
    /** Showcase tombs are listed first and highlighted on the tombs page. */
    featured: z.boolean().default(false),
    /** Position among showcase tombs (lower first). */
    order: z.number().default(99),
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

export const collections = { periods, dynasties, pharaohs, monuments, tombs, artifacts, videos, plans };
