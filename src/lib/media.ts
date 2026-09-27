import type { ImageMetadata } from 'astro';

export type MediaKind = 'photo' | 'reconstruction' | 'illustration' | 'diagram';

export interface MediaImage {
  src: ImageMetadata;
  alt: string;
  caption?: string;
  credit?: string;
  license?: string;
  sourceUrl?: string;
  kind?: MediaKind;
}

export const KIND_LABEL: Record<MediaKind, string> = {
  photo: 'Photo',
  reconstruction: 'Reconstruction',
  illustration: 'Illustration',
  diagram: 'Diagram',
};

/** "Reconstruction · NeoKemetAI · CC BY 4.0" */
export function creditLine(m: Pick<MediaImage, 'kind' | 'credit' | 'license'>): string {
  return [m.kind && m.kind !== 'photo' ? KIND_LABEL[m.kind] : undefined, m.credit, m.license].filter(Boolean).join(' · ');
}

/** Responsive widths never exceed the source image. */
export const widthsFor = (src: ImageMetadata, wanted: number[]) => {
  const w = wanted.filter((x) => x < src.width);
  return [...w, Math.min(src.width, wanted.at(-1) ?? src.width)];
};

export const isSvg = (src: ImageMetadata) => src.format === 'svg';

/** YouTube thumbnail URLs (16:9 variants only). */
export const youtubeThumb = (id: string) => ({
  small: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
  large: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
  srcset: `https://i.ytimg.com/vi/${id}/mqdefault.jpg 320w, https://i.ytimg.com/vi/${id}/maxresdefault.jpg 1280w`,
});
