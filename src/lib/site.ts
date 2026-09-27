export const SITE = {
  name: 'NeoKemetAI',
  tagline: 'Ancient Egypt, reconstructed',
  description:
    'NeoKemetAI is a cinematic, interactive guide to ancient Egypt: all thirty dynasties, the pharaohs, monuments, tombs and artifacts, with documentaries from the NeoKemet channel.',
  locale: 'en_US',
  lang: 'en',
  defaultOgImage: '/og-default.png',
} as const;

export const YOUTUBE = {
  handle: '@NeoKemetAI',
  channelId: 'UCxhAliS0D-tm9y0hk3Q0psg',
  url: 'https://www.youtube.com/@NeoKemetAI',
  subscribeUrl: 'https://www.youtube.com/@NeoKemetAI?sub_confirmation=1',
  playlistsUrl: 'https://www.youtube.com/@NeoKemetAI/playlists',
} as const;

export const PLAYLISTS = {
  'sleep-documentaries': { label: 'Sleep Documentaries', blurb: 'Long, calm narrations of Egyptian history to fall asleep to.' },
  'ancient-engineering': { label: 'Ancient Engineering', blurb: 'How pyramids, obelisks and colossi were actually built.' },
  'gods-and-myths': { label: 'Gods & Myths', blurb: 'The gods, the Duat and the stories Egyptians told about them.' },
  'archaeological-discoveries': { label: 'Archaeological Discoveries', blurb: 'Tombs, finds and the people who made them.' },
} as const;

export const FORMATS = {
  documentary: 'Documentary',
  sleep: 'History for Sleep',
  reference: 'Complete Reference',
  short: 'Short',
} as const;

export const NAV = [
  { href: '/timeline/', label: 'Timeline' },
  { href: '/pharaohs/', label: 'Pharaohs' },
  { href: '/monuments/', label: 'Monuments' },
  { href: '/tombs/', label: 'Tombs' },
  { href: '/artifacts/', label: 'Artifacts' },
  { href: '/videos/', label: 'Videos' },
] as const;

/** Decorative hieroglyphs used as section marks (rendered with Noto Sans Egyptian Hieroglyphs). */
export const GLYPHS = {
  dynasties: '𓇳',
  pharaohs: '𓇓',
  monuments: '𓉴',
  tombs: '𓉐',
  artifacts: '𓋹',
  videos: '𓂀',
} as const;
