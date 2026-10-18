/** The three hands-on experiences, and the pages that link to each. */
export type ExperienceKey = 'game' | 'lab' | 'map';

export interface Experience {
  href: string;
  title: string;
  kicker: string;
  text: string;
  glyph: string;
  image: string;
  alt: string;
}

export const EXPERIENCES: Record<ExperienceKey, Experience> = {
  map: {
    href: '/tombs/valley-of-the-kings-map/',
    title: 'Valley of the Kings 3D Map',
    kicker: 'Interactive · 3D map',
    text: 'Fly over the real terrain of the royal valley, find 65 tombs and watch them appear in the order they were cut and discovered.',
    glyph: '𓉐',
    image: '/images/interactive/vok-map.webp',
    alt: 'A 3D terrain map of the Valley of the Kings with tomb markers',
  },
  lab: {
    href: '/play/pyramid-lab/',
    title: 'Pyramid Builder Lab',
    kicker: 'Interactive · Simulation',
    text: 'Choose a ramp theory, a workforce and wet or dry sand, and see whether you can finish the Great Pyramid within Khufu’s reign.',
    glyph: '𓉴',
    image: '/images/interactive/pyramid-lab.webp',
    alt: 'The Pyramid Builder Lab simulation with a rising pyramid and its controls',
  },
  game: {
    href: '/play/',
    title: 'Rise of Waset',
    kicker: 'Interactive · City-builder',
    text: 'Found a city on the Nile, live through the flood seasons, keep Ma’at in balance and raise a pyramid. Free in your browser.',
    glyph: '𓊖',
    image: '/images/interactive/rise-of-waset.webp',
    alt: 'The Rise of Waset city-builder with fields, houses and the Nile',
  },
};

const LINKS: Record<ExperienceKey, Partial<Record<'monuments' | 'pharaohs' | 'dynasties' | 'tombs', string[]>>> = {
  map: {
    monuments: ['temple-of-hatshepsut', 'medinet-habu'],
    pharaohs: ['tutankhamun', 'thutmose-iii', 'hatshepsut', 'ramesses-ii', 'ramesses-iii', 'akhenaten'],
    dynasties: ['18', '19', '20'],
  },
  lab: {
    monuments: ['great-pyramid', 'giza-plateau', 'great-sphinx', 'step-pyramid-of-djoser'],
    pharaohs: ['khufu', 'khafre', 'menkaure', 'djoser'],
    dynasties: ['3', '4'],
  },
  game: {
    monuments: ['karnak-temple-complex', 'great-pyramid', 'temple-of-hatshepsut'],
    pharaohs: ['mentuhotep-ii'],
    dynasties: ['11'],
  },
};

/** Experiences relevant to an entry; every tomb links to the valley map. */
export function experiencesFor(collection: 'monuments' | 'pharaohs' | 'dynasties' | 'tombs', id: string): ExperienceKey[] {
  return (Object.keys(LINKS) as ExperienceKey[]).filter(
    (key) => (key === 'map' && collection === 'tombs') || LINKS[key][collection]?.includes(id),
  );
}
