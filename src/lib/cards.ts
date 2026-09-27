import type { CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { excerpt } from './content';
import { formatDuration, formatRange, formatYear, ordinal } from './format';
import { youtubeThumb } from './media';
import { FORMATS, GLYPHS } from './site';
import type { CardImage, Props as CardProps } from '@/components/Card.astro';

type WithHero = { data: { media: { hero?: { src: ImageMetadata; alt: string } } } };
/** Cards show the entry's featured image when it has one. */
const heroImage = (e: WithHero): CardImage | undefined => e.data.media.hero && { src: e.data.media.hero.src, alt: e.data.media.hero.alt };

/** Maps each content type to the props of a <Card>, so listings stay consistent. */
export const cards = {
  dynasty: (d: CollectionEntry<'dynasties'>): CardProps => ({
    href: `/dynasties/${d.id}/`,
    kicker: `${ordinal(d.data.number)} Dynasty`,
    title: d.data.name,
    meta: `${formatRange(d.data.start, d.data.end)} · ${d.data.capital}`,
    text: d.data.summary,
    glyph: GLYPHS.dynasties,
    image: heroImage(d),
  }),
  pharaoh: (p: CollectionEntry<'pharaohs'>): CardProps => ({
    href: `/pharaohs/${p.id}/`,
    kicker: `${ordinal(Number(p.data.dynasty.id))} Dynasty`,
    title: p.data.name,
    meta: `${p.data.epithet ? `${p.data.epithet} · ` : ''}${formatRange(p.data.reignStart, p.data.reignEnd)}`,
    text: excerpt(p.body),
    glyph: GLYPHS.pharaohs,
    image: heroImage(p),
  }),
  monument: (m: CollectionEntry<'monuments'>): CardProps => ({
    href: `/monuments/${m.id}/`,
    kicker: m.data.type,
    title: m.data.name,
    meta: `${m.data.site} · ${formatYear(m.data.built)}`,
    text: excerpt(m.body),
    glyph: GLYPHS.monuments,
    image: heroImage(m),
  }),
  tomb: (t: CollectionEntry<'tombs'>): CardProps => ({
    href: `/tombs/${t.id}/`,
    kicker: t.data.code ?? `${ordinal(Number(t.data.dynasty.id))} Dynasty`,
    title: t.data.name,
    meta: t.data.site,
    text: excerpt(t.body),
    glyph: GLYPHS.tombs,
    image: heroImage(t),
  }),
  artifact: (a: CollectionEntry<'artifacts'>): CardProps => ({
    href: `/artifacts/${a.id}/`,
    kicker: `${ordinal(Number(a.data.dynasty.id))} Dynasty`,
    title: a.data.name,
    meta: a.data.museum,
    text: excerpt(a.body),
    glyph: GLYPHS.artifacts,
    image: heroImage(a),
  }),
  video: (v: CollectionEntry<'videos'>): CardProps => ({
    href: `/videos/${v.id}/`,
    kicker: v.data.youtubeId ? FORMATS[v.data.format] : `${FORMATS[v.data.format]} · Coming soon`,
    title: v.data.title,
    text: v.data.description,
    glyph: GLYPHS.videos,
    image: videoImage(v),
  }),
};

function videoImage(v: CollectionEntry<'videos'>): CardImage | undefined {
  const badge = formatDuration(v.data.duration);
  if (v.data.thumbnail) return { src: v.data.thumbnail, alt: '', badge };
  if (v.data.youtubeId) {
    const t = youtubeThumb(v.data.youtubeId);
    return { src: t.large, srcset: t.srcset, alt: '', badge };
  }
  return undefined;
}
