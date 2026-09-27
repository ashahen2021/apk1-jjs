/**
 * Ancient cities and sites shown on the map (not every one has its own page).
 * Coordinates are approximate site centres in decimal degrees.
 */
export interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
  kind: 'capital' | 'city' | 'fortress';
  note: string;
  /** Major places keep their label when the map is zoomed out. */
  major?: boolean;
}

export const PLACES: Place[] = [
  { id: 'memphis', name: 'Memphis', lat: 29.844, lon: 31.255, kind: 'capital', note: 'Royal capital for much of the Old Kingdom and beyond', major: true },
  { id: 'thebes', name: 'Thebes', lat: 25.699, lon: 32.639, kind: 'capital', note: 'Capital of the Middle and New Kingdoms (modern Luxor)', major: true },
  { id: 'abydos', name: 'Abydos', lat: 26.185, lon: 31.919, kind: 'city', note: 'Royal burials of the first kings; cult centre of Osiris', major: true },
  { id: 'amarna', name: 'Amarna', lat: 27.645, lon: 30.897, kind: 'capital', note: "Akhenaten's short-lived capital, Akhetaten", major: true },
  { id: 'hierakonpolis', name: 'Hierakonpolis', lat: 25.097, lon: 32.779, kind: 'city', note: 'Early royal centre where the Narmer Palette was found' },
  { id: 'elephantine', name: 'Elephantine', lat: 24.085, lon: 32.886, kind: 'city', note: "Egypt's southern frontier at the First Cataract", major: true },
  { id: 'avaris', name: 'Avaris / Pi-Ramesses', lat: 30.79, lon: 31.828, kind: 'capital', note: 'Hyksos capital, later the Delta residence of Ramesses II', major: true },
  { id: 'tanis', name: 'Tanis', lat: 30.975, lon: 31.88, kind: 'capital', note: 'Royal city of the 21st and 22nd Dynasties' },
  { id: 'sais', name: 'Sais', lat: 30.965, lon: 30.768, kind: 'capital', note: 'Capital of the 24th and 26th Dynasties', major: true },
  { id: 'bubastis', name: 'Bubastis', lat: 30.572, lon: 31.51, kind: 'capital', note: 'Seat of the 22nd Dynasty; cult centre of Bastet' },
  { id: 'mendes', name: 'Mendes', lat: 30.958, lon: 31.517, kind: 'capital', note: 'Capital of the 29th Dynasty' },
  { id: 'sebennytos', name: 'Sebennytos', lat: 30.96, lon: 31.24, kind: 'capital', note: 'Home of the 30th Dynasty' },
  { id: 'herakleopolis', name: 'Herakleopolis', lat: 29.085, lon: 30.934, kind: 'capital', note: 'Capital of the 9th and 10th Dynasties' },
  { id: 'itjtawy', name: 'Itjtawy', lat: 29.57, lon: 31.23, kind: 'capital', note: 'Capital of the 12th Dynasty, near el-Lisht' },
  { id: 'buhen', name: 'Buhen', lat: 21.91, lon: 31.29, kind: 'fortress', note: 'Middle Kingdom fortress at the Second Cataract', major: true },
  { id: 'semna', name: 'Semna', lat: 21.49, lon: 30.957, kind: 'fortress', note: "Senusret III's frontier fortress" },
];

export const REGIONS = [
  { name: 'Mediterranean Sea', lat: 31.85, lon: 29.4 },
  { name: 'Lower Egypt', lat: 30.25, lon: 29.55 },
  { name: 'Upper Egypt', lat: 27.1, lon: 29.7 },
  { name: 'Western Desert', lat: 24.9, lon: 29.4 },
  { name: 'Eastern Desert', lat: 26.9, lon: 32.9 },
  { name: 'Sinai', lat: 29.4, lon: 33.75 },
  { name: 'Red Sea', lat: 25.3, lon: 35.05 },
  { name: 'Nubia', lat: 21.75, lon: 32.75 },
];
