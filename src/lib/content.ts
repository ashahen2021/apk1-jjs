import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';

type Ref<C extends CollectionKey> = { collection: C; id: string };

export const byNumber = (a: CollectionEntry<'dynasties'>, b: CollectionEntry<'dynasties'>) =>
  a.data.number - b.data.number;

export async function getPeriods() {
  return (await getCollection('periods')).sort((a, b) => a.data.start - b.data.start);
}

export async function getDynasties() {
  return (await getCollection('dynasties')).sort(byNumber);
}

export async function getPharaohs() {
  return (await getCollection('pharaohs')).sort((a, b) => a.data.reignStart - b.data.reignStart);
}

export async function getMonuments() {
  return (await getCollection('monuments')).sort((a, b) => a.data.built - b.data.built);
}

/** Tombs and artifacts have no own date, so they sort by their dynasty. */
async function sortByDynasty<C extends 'tombs' | 'artifacts'>(collection: C) {
  const entries = await getCollection(collection);
  return entries.sort((a, b) => Number(a.data.dynasty.id) - Number(b.data.dynasty.id));
}
export const getTombs = () => sortByDynasty('tombs');
export const getArtifacts = () => sortByDynasty('artifacts');

export async function getVideos() {
  // Published videos first (newest first), then announced ones in file order.
  return (await getCollection('videos')).sort(
    (a, b) => (b.data.published?.getTime() ?? 0) - (a.data.published?.getTime() ?? 0),
  );
}

const has = <C extends CollectionKey>(refs: Ref<C>[] | undefined, id: string) =>
  refs?.some((r) => r.id === id) ?? false;

/** Everything that links back to a given pharaoh. */
export async function relatedToPharaoh(id: string) {
  const [monuments, tombs, artifacts, videos] = await Promise.all([
    getMonuments(),
    getTombs(),
    getArtifacts(),
    getVideos(),
  ]);
  return {
    monuments: monuments.filter((m) => has(m.data.pharaohs, id)),
    tombs: tombs.filter((t) => t.data.pharaoh?.id === id),
    artifacts: artifacts.filter((a) => a.data.pharaoh?.id === id),
    videos: videos.filter((v) => has(v.data.pharaohs, id)),
  };
}

/** Everything that links back to a given dynasty. */
export async function relatedToDynasty(id: string) {
  const [pharaohs, tombs, artifacts, videos] = await Promise.all([
    getPharaohs(),
    getTombs(),
    getArtifacts(),
    getVideos(),
  ]);
  const inDynasty = pharaohs.filter((p) => p.data.dynasty.id === id);
  const pharaohIds = new Set(inDynasty.map((p) => p.id));
  const monuments = (await getMonuments()).filter((m) => m.data.pharaohs.some((r) => pharaohIds.has(r.id)));
  return {
    pharaohs: inDynasty,
    monuments,
    tombs: tombs.filter((t) => t.data.dynasty.id === id),
    artifacts: artifacts.filter((a) => a.data.dynasty.id === id),
    videos: videos.filter((v) => has(v.data.dynasties, id)),
  };
}

type Linkable = 'monuments' | 'tombs' | 'artifacts';
/** Videos that reference a monument, tomb or artifact. */
export async function videosAbout(collection: Linkable, id: string) {
  return (await getVideos()).filter((v) => has(v.data[collection], id));
}

/** First paragraph of Markdown body, stripped of formatting, for card excerpts. */
export function excerpt(body: string | undefined, max = 180): string {
  const para = (body ?? '').trim().split(/\n\s*\n/)[0] ?? '';
  const text = para.replace(/[*_`#>]/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1');
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text;
}
