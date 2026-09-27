/**
 * Structured content for the Giza cluster: evidence levels, construction
 * theories, open questions and references. Kept as data so the pages, diagrams
 * and source lists stay consistent.
 *
 * Every reference records how it was used when this content was checked:
 *   direct    — the source itself (or its abstract / full text) was read;
 *   secondary — a reference work was read and used to check a fact; it cites
 *               the primary literature, which was not read;
 *   standard  — a standard work cited for context but not consulted in the check.
 * Every factual claim cites at least one direct or secondary source.
 */

export type Level = 'established' | 'plausible' | 'debated' | 'speculative';

export const LEVELS: Record<Level, { label: string; help: string }> = {
  established: { label: 'Well-supported evidence', help: 'Physical remains, inscriptions or measurements that archaeologists agree on.' },
  plausible: { label: 'Plausible reconstruction', help: 'Consistent with the evidence and widely accepted, but not directly proven.' },
  debated: { label: 'Active scholarly debate', help: 'Proposed by specialists; the evidence is partial or points in different directions.' },
  speculative: { label: 'Speculative or weakly supported', help: 'Contradicted by, or lacking, archaeological evidence. Mentioned so readers can place it.' },
};

export type Access = 'direct' | 'secondary' | 'standard';
export const ACCESS: Record<Access, { title: string; help: string }> = {
  direct: { title: 'Sources consulted directly', help: 'Read (in full, in the relevant section, or as the published abstract) when this page was checked.' },
  secondary: { title: 'Reference works consulted', help: 'Encyclopedia articles read to check specific facts; they cite the primary literature listed with them, which was not itself read.' },
  standard: { title: 'Standard references cited but not consulted', help: 'Recognised works named for context and further reading. They were not read when this page was checked, so no claim here rests on them alone. Marked * in inline citations.' },
};

export interface Ref { id: string; label: string; url?: string; access: Access; note?: string }

const R = (r: Ref) => r;

/** References used on the Giza pages. Cite by id. */
export const REFS: Record<string, Ref> = {
  // ---- consulted directly
  petrie: R({ id: 'petrie', access: 'direct', label: 'W. M. F. Petrie, The Pyramids and Temples of Gizeh (London, 1883), chs 6–7', url: 'http://www.ronaldbirdsall.com/gizeh/petrie/c7.html', note: 'Exterior dimensions, orientation, passages, chambers, roof beams, Gallery corbels, coffer tool marks, Khufu cartouche above the King\'s Chamber.' }),
  procureur: R({ id: 'procureur', access: 'direct', label: 'S. Procureur et al., "Precise characterization of a corridor-shaped structure in Khufu\'s Pyramid by observation of cosmic-ray muons", Nature Communications 14 (2023), 1144', url: 'https://doi.org/10.1038/s41467-023-36351-0', note: 'North Face Corridor: 9.06 × 2.02 × 2.18 m, about 20 m above ground, just behind the chevron blocks.' }),
  fall: R({ id: 'fall', access: 'direct', label: 'A. Fall et al., "Sliding Friction on Wet and Dry Sand", Physical Review Letters 112 (2014), 175502', url: 'https://doi.org/10.1103/PhysRevLett.112.175502' }),
  sheisha: R({ id: 'sheisha', access: 'direct', label: 'H. Sheisha et al., "Nile waterscapes facilitated the construction of the Giza pyramids during the 3rd millennium BCE", PNAS 119 (2022), e2202530119 (abstract)', url: 'https://doi.org/10.1073/pnas.2202530119' }),
  spence: R({ id: 'spence', access: 'direct', label: 'K. Spence, "Ancient Egyptian chronology and the astronomical orientation of pyramids", Nature 408 (2000), 320–324 (abstract)', url: 'https://doi.org/10.1038/35042510' }),
  hatnub: R({ id: 'hatnub', access: 'direct', label: 'University of Liverpool and IFAO (Y. Gourdon, R. Enmarch), "Ancient quarry ramp system may have helped workers build Egypt\'s Great Pyramids" (2018)', url: 'https://news.liverpool.ac.uk/2018/11/02/ancient-quarry-ramp-system-may-have-helped-workers-build-egypts-great-pyramids/' }),
  aera: R({ id: 'aera', access: 'direct', label: 'Ancient Egypt Research Associates (AERA), "The Lost City of the Pyramid Builders (Heit el-Ghurab)"', url: 'https://aeraweb.org/projects/lost-city/' }),
  aeraGeology: R({ id: 'aeraGeology', access: 'direct', label: 'AERA, "Geology of the Sphinx" (after K. L. Gauri, Geoarchaeology, 1995)', url: 'https://aeraweb.org/geology-of-the-sphinx/' }),
  arce: R({ id: 'arce', access: 'direct', label: 'D. Everett, "The Long-Hidden ARCE Sphinx Mapping Project Is Unveiled", American Research Center in Egypt (2018)', url: 'https://arce.org/resource/long-hidden-arce-sphinx-mapping-project-unveiled/' }),
  hawassConservation: R({ id: 'hawassConservation', access: 'direct', label: 'Z. Hawass, "History of the Conservation of the Sphinx" (Guardian\'s Egypt)', url: 'https://www.guardians.net/hawass/sphinx2.htm' }),
  lehnerLabor: R({ id: 'lehnerLabor', access: 'direct', label: 'M. Lehner, "Labor and the Pyramids: The Heit el-Ghurab \'Workers Town\' at Giza", in P. Steinkeller and M. Hudson (eds), Labor in the Ancient World (Dresden, 2015), 397–522 (excerpts)', url: 'https://www.researchgate.net/publication/303875906_Labor_and_the_Pyramids_The_Heit_el-Ghurab_Workers_Town_at_Giza' }),
  moa: R({ id: 'moa', access: 'direct', label: 'Egyptian Ministry of Tourism and Antiquities, "Workers\' Town and Cemetery"', url: 'https://egymonuments.gov.eg/en/monuments/workers-town-and-cemetery' }),

  // ---- reference works consulted (they cite the primary literature)
  wpGP: R({ id: 'wpGP', access: 'secondary', label: 'Wikipedia, "Great Pyramid of Giza" (revision of 21 Sept 2026)', url: 'https://en.wikipedia.org/wiki/Great_Pyramid_of_Giza', note: 'Height today, volume and block estimate, Herodotus, Queen\'s Chamber shaft "door", relieving chambers found by Vyse, Aswan granite up to about 80 tonnes.' }),
  wpGiza: R({ id: 'wpGiza', access: 'secondary', label: 'Wikipedia, "Giza pyramid complex"', url: 'https://en.wikipedia.org/wiki/Giza_pyramid_complex', note: 'Layout of the complexes, cemeteries, remaining casing, workers\' village and workforce estimates.' }),
  wpConstruction: R({ id: 'wpConstruction', access: 'secondary', label: 'Wikipedia, "Construction of the Egyptian pyramids"', url: 'https://en.wikipedia.org/wiki/Construction_of_the_Egyptian_pyramids', note: 'Ramp proposals and their critiques, levering, Herodotus\'s account, Houdin, workforce study, Hatnub.' }),
  wpMerer: R({ id: 'wpMerer', access: 'secondary', label: 'Wikipedia, "Diary of Merer" (after P. Tallet)', url: 'https://en.wikipedia.org/wiki/Diary_of_Merer' }),
  wpSphinx: R({ id: 'wpSphinx', access: 'secondary', label: 'Wikipedia, "Great Sphinx of Giza"', url: 'https://en.wikipedia.org/wiki/Great_Sphinx_of_Giza', note: 'Dimensions, attributions (Stadelmann, Dobrev), Reader, nose, beard, pigments, Dream Stela, Sphinx Temple.' }),
  wpErosion: R({ id: 'wpErosion', access: 'secondary', label: 'Wikipedia, "Sphinx water erosion hypothesis"', url: 'https://en.wikipedia.org/wiki/Sphinx_water_erosion_hypothesis' }),
  wpKhafre: R({ id: 'wpKhafre', access: 'secondary', label: 'Wikipedia, "Pyramid of Khafre"', url: 'https://en.wikipedia.org/wiki/Pyramid_of_Khafre' }),
  wpMenkaure: R({ id: 'wpMenkaure', access: 'secondary', label: 'Wikipedia, "Pyramid of Menkaure"', url: 'https://en.wikipedia.org/wiki/Pyramid_of_Menkaure' }),
  wp4: R({ id: 'wp4', access: 'secondary', label: 'Wikipedia, "Fourth Dynasty of Egypt"', url: 'https://en.wikipedia.org/wiki/Fourth_Dynasty_of_Egypt' }),
  wpDavidovits: R({ id: 'wpDavidovits', access: 'secondary', label: 'Wikipedia, "Joseph Davidovits"', url: 'https://en.wikipedia.org/wiki/Joseph_Davidovits' }),

  // ---- standard references, not consulted in this check
  lehner97: R({ id: 'lehner97', access: 'standard', label: 'M. Lehner, The Complete Pyramids (London: Thames & Hudson, 1997)' }),
  lehnerHawass: R({ id: 'lehnerHawass', access: 'standard', label: 'M. Lehner and Z. Hawass, Giza and the Pyramids (London: Thames & Hudson, 2017)' }),
  tallet: R({ id: 'tallet', access: 'standard', label: 'P. Tallet, Les papyrus de la mer Rouge I: le « journal de Merer » (Cairo: IFAO, 2017); P. Tallet and M. Lehner, The Red Sea Scrolls (London: Thames & Hudson, 2021)' }),
  morishima: R({ id: 'morishima', access: 'standard', label: 'K. Morishima et al., "Discovery of a big void in Khufu\'s Pyramid by observation of cosmic-ray muons", Nature 552 (2017), 386–390', url: 'https://doi.org/10.1038/nature24647' }),
  dash: R({ id: 'dash', access: 'standard', label: 'G. Dash, "Occam\'s Egyptian Razor: The Equinox and the Alignment of the Pyramids", Journal of Ancient Egyptian Architecture 2 (2017)', url: 'https://www.academia.edu/31435265/Occam_s_Egyptian_Razor_The_Equinox_and_the_Alignment_of_the_Pyramids' }),
  houdin: R({ id: 'houdin', access: 'standard', label: 'J.-P. Houdin, Khufu: The Secrets Behind the Building of the Great Pyramid (Cairo: Farid Atiya Press, 2006)' }),
  lehnerSphinx: R({ id: 'lehnerSphinx', access: 'standard', label: 'M. Lehner, Archaeology of an Image: The Great Sphinx of Giza (PhD thesis, Yale University, 1991)' }),
  schoch: R({ id: 'schoch', access: 'standard', label: 'R. M. Schoch, "Redating the Great Sphinx of Giza", KMT 3.2 (1992)' }),
  reader: R({ id: 'reader', access: 'standard', label: 'C. D. Reader, "A Geomorphological Study of the Giza Necropolis, with Implications for the Development of the Site", Archaeometry 43 (2001), 149–165', url: 'https://doi.org/10.1111/1475-4754.00009' }),
  stadelmann: R({ id: 'stadelmann', access: 'standard', label: 'R. Stadelmann, in R. Schulz and M. Seidel (eds), Egypt: The World of the Pharaohs (Cologne, 1998)' }),
  maqrizi: R({ id: 'maqrizi', access: 'standard', label: 'al-Maqrizi, al-Mawaʿiz wa-l-Iʿtibar (15th century)' }),
  herodotus: R({ id: 'herodotus', access: 'standard', label: 'Herodotus, Histories II.124–125 (5th century BCE); quoted in the reference work above' }),
  unesco: R({ id: 'unesco', access: 'standard', label: 'UNESCO World Heritage Centre, "Memphis and its Necropolis – the Pyramid Fields from Giza to Dahshur" (1979)', url: 'https://whc.unesco.org/en/list/86/' }),
};

export interface Theory {
  id: string;
  title: string;
  level: Level;
  summary: string;
  evidence: string[];
  problems: string[];
  refs: string[];
}

/** How was the Great Pyramid built? Ordered from the best to the least supported. */
export const THEORIES: Theory[] = [
  {
    id: 'quarry', title: 'Local quarries, Tura limestone and Aswan granite', level: 'established',
    summary: 'Most of the pyramid is local limestone from the Giza plateau. Fine white limestone for the casing came from Tura across the river, and granite for the King\'s Chamber from Aswan.',
    evidence: ['Reference works describe the core as mainly local plateau limestone, with Tura limestone and Aswan granite brought by boat.', 'The papyri of the inspector Merer, dated to year 26–27 of Khufu, record his crew shipping limestone from the Tura quarries to Giza.', 'Petrie recorded saw marks and a tube-drill hole on the granite coffer in the King\'s Chamber.'],
    problems: ['The core also contains a natural rock outcrop; how much of the volume it takes up is not precisely known.'],
    refs: ['wpGP', 'wpMerer', 'petrie', 'tallet'],
  },
  {
    id: 'transport', title: 'Boats, waterways and sledges', level: 'established',
    summary: 'Heavy stone travelled by boat on the Nile and on waterways reaching the foot of the plateau, then on sledges.',
    evidence: ['Merer\'s logbook records voyages from Tura to Giza, stopping at a basin called She-Khufu; Tallet identifies a harbour at Giza, Ro-She-Khufu, as the destination of the casing stones.', 'Sediment cores show that a branch of the Nile stood at high water beside Giza in the reigns of Khufu, Khafre and Menkaure (Sheisha et al. 2022).', 'A Middle Kingdom painting in the tomb of Djehutihotep (about 1880 BCE) shows water poured in front of a sledge carrying a colossus; laboratory tests show that damp sand can greatly reduce the pull needed (Fall et al. 2014).'],
    problems: ['The layout of the harbours and canals at Giza is still being investigated.'],
    refs: ['wpMerer', 'sheisha', 'fall', 'tallet'],
  },
  {
    id: 'workforce', title: 'An organised, fed and housed workforce', level: 'established',
    summary: 'The pyramids were built by organised crews supported by bakers, brewers and administrators, who lived in a town at the foot of the plateau. Crews were organised in named gangs and smaller divisions.',
    evidence: ['The excavated town of Heit el-Ghurab, south-east of the plateau beyond a large stone wall, with bakeries, kitchens, workshops and large quantities of animal bone.', 'A cemetery of workers and overseers nearby, with skeletons showing healed injuries.', 'Merer\'s crew is recorded as a phyle (a work unit) in his logbook.'],
    problems: ['The size of the workforce is an estimate. Figures in the literature range from a low calculation of about 2,000 builders to a construction-management study (with Mark Lehner) of about 14,500 on average and 40,000 at the peak.'],
    refs: ['aera', 'moa', 'wpGiza', 'lehnerLabor', 'wpConstruction', 'wpMerer'],
  },
  {
    id: 'straight', title: 'A straight ramp', level: 'debated',
    summary: 'One long ramp built against a face and raised as the pyramid rose.',
    evidence: ['Remains of small construction ramps and inclined causeways have been found at Giza and at other pyramids.', 'A ramp works well for the lower courses, where most of the volume lies.'],
    problems: ['At a gradient of 1:10 it would need to be about 1.5 km long to reach the top (146.7 m × 10).', 'As a way to build the whole pyramid it is widely rejected: it would be enormous and costly, and no such ramp has been found.'],
    refs: ['wpConstruction'],
  },
  {
    id: 'zigzag', title: 'Zigzag or switchback ramps', level: 'debated',
    summary: 'Ramps climbing a face in legs, turning back on landings.',
    evidence: ['Proposed to keep the ramps shorter and smaller.', 'At the Hatnub quarry, a ramp flanked by stairs with post holes, dating at least to Khufu\'s reign, was used to haul blocks up slopes of 20 per cent or more.'],
    problems: ['The faces become shorter as the pyramid rises, leaving less room for ramps and for turning blocks.'],
    refs: ['wpConstruction', 'hatnub'],
  },
  {
    id: 'spiral', title: 'A ramp wrapping around the pyramid', level: 'debated',
    summary: 'A ramp spiralling around the faces. Mark Lehner has suggested a spiral ramp starting in the quarry to the south-east.',
    evidence: ['Keeps a steady gradient all the way up.'],
    problems: ['It would cover the building for years and hide the corners and edges that builders needed to keep the pyramid true.'],
    refs: ['wpConstruction', 'lehner97'],
  },
  {
    id: 'levers', title: 'Levering and lifting devices', level: 'debated',
    summary: 'Blocks raised step by step with levers, probably together with ramps. Levering is widely considered the most likely complement to ramps.',
    evidence: ['Herodotus, writing in the 5th century BCE, says the stones were raised from tier to tier with levers made of short timbers.', 'Experiments (for example by Martin Isler for NOVA in 1992) have raised blocks one course at a time with levers and shims.', 'Lehner has suggested levers for the small volume of stone near the top, where ramps are least practical.'],
    problems: ['Herodotus wrote about 2,000 years after the pyramid was built.', 'Raising the King\'s Chamber granite, with blocks reported at up to about 80 tonnes, remains hard to explain.'],
    refs: ['wpConstruction', 'wpGP', 'herodotus'],
  },
  {
    id: 'internal', title: 'An internal ramp', level: 'speculative',
    summary: 'The architect Jean-Pierre Houdin proposes an external ramp for roughly the lowest 30 per cent of the height, and above it a ramp spiralling inside the pyramid, just behind the faces.',
    evidence: ['Would explain the absence of large external ramps.', 'Houdin points to a notch near one corner of the pyramid as a possible opening.'],
    problems: ['The hypothesis remains unproven.', 'Egyptologists including David Jeffreys and John Baines have criticised it as far-fetched or too narrowly focused on one pyramid.'],
    refs: ['wpConstruction', 'houdin'],
  },
  {
    id: 'cast', title: 'Blocks cast from limestone concrete', level: 'speculative',
    summary: 'The chemist Joseph Davidovits proposes that most blocks were cast in moulds from a limestone slurry rather than cut.',
    evidence: ['A 2006 materials-science study (M. Barsoum and colleagues) reported microstructures it argued were man-made.'],
    problems: ['The idea is not accepted by the academic mainstream; a petrographic study (D. Jana, 2007) rejected a man-made origin.', 'It does not explain the large granite blocks, which Davidovits agrees were carved.'],
    refs: ['wpDavidovits'],
  },
];

/** What the evidence shows about the Great Pyramid. */
export const EVIDENCE_SHOWS: { text: string; refs: string[] }[] = [
  { text: 'It was built for Khufu of the 4th Dynasty (reigned c. 2589–2566 BCE). A cartouche of Khufu is painted in one of the relieving chambers above the King\'s Chamber, and Merer\'s papyri record deliveries of stone for his pyramid in year 26–27 of his reign.', refs: ['petrie', 'wpMerer', 'wp4'] },
  { text: 'It was laid out with great precision: a base of 230.35 m a side, its four sides within a few centimetres of each other, and turned on average only about 3′43″ from true north (Petrie).', refs: ['petrie'] },
  { text: 'Its stone came from local quarries, from Tura and from Aswan, and was moved by boat and sledge.', refs: ['wpGP', 'wpMerer', 'sheisha'] },
  { text: 'An organised workforce lived in a planned town at the foot of the plateau, with bakeries and a cemetery.', refs: ['aera', 'moa', 'wpGiza'] },
  { text: 'Its chambers and passages were surveyed by Petrie (published 1883); muon imaging has since found a corridor behind the entrance chevrons (2023) and a large void above the Grand Gallery (2017).', refs: ['petrie', 'procureur', 'morishima'] },
];

/** What remains debated. */
export const DEBATED: { text: string; refs: string[] }[] = [
  { text: 'Which ramp system, or combination of ramps and levering, was used for the upper courses.', refs: ['wpConstruction'] },
  { text: 'How the granite of the King\'s Chamber, with blocks reported at up to about 80 tonnes, was raised about 43 m above the base.', refs: ['wpGP', 'petrie'] },
  { text: 'How the sides were aligned: by the simultaneous transit of two stars (Spence 2000), by the sun at the equinox (Dash 2017), or otherwise.', refs: ['spence', 'dash'] },
  { text: 'The purpose of the narrow shafts from the King\'s and Queen\'s Chambers. The Queen\'s Chamber shafts were sealed at the chamber end and one ends at a stone "door" with copper handles.', refs: ['petrie', 'wpGP'] },
  { text: 'What the "Big Void" above the Grand Gallery is, and its exact shape.', refs: ['morishima', 'procureur'] },
  { text: 'The size of the workforce and the length of construction. Herodotus gives twenty years, which fits within Khufu\'s reign of about 23 years.', refs: ['wpGP', 'wpConstruction', 'wp4'] },
];

/** The Sphinx: scholarly positions on date and attribution. */
export const SPHINX_POSITIONS: { title: string; level: Level; text: string; refs: string[] }[] = [
  { title: 'Carved for Khafre, about 2500 BCE', level: 'plausible', text: 'The attribution given by most archaeologists and Egyptologists. The Sphinx lies beside Khafre\'s valley temple; the angle of its enclosure\'s south wall suggests Khafre\'s causeway already existed; and the Sphinx Temple in front, built from stone cut from around the Sphinx, resembles Khafre\'s mortuary temple.', refs: ['wpSphinx', 'wpErosion', 'wpKhafre'] },
  { title: 'Carved for Khufu', level: 'debated', text: 'Rainer Stadelmann argued from the style of the headdress and the detached beard that the Sphinx represents Khufu, and that Khafre\'s causeway was built to respect a Sphinx already there.', refs: ['wpSphinx', 'stadelmann'] },
  { title: 'Carved for Djedefre', level: 'debated', text: 'In 2004 Vassil Dobrev (IFAO) announced evidence that Khufu\'s son Djedefre may have made it. This remains a minority view.', refs: ['wpSphinx'] },
  { title: 'Much older than the pyramids', level: 'speculative', text: 'The geologist Robert Schoch argued that erosion of the enclosure walls required long periods of heavy rain, first dating the Sphinx to 5000 BCE or earlier and later to around 9700 BCE. Most archaeologists reject this. Critics attribute the erosion to salt crystallisation (haloclasty) in the soft Member II limestone, to run-off and floods, and note evidence of heavy rain into the Old Kingdom; no archaeological evidence of an earlier builder has been found.', refs: ['wpErosion', 'schoch'] },
];

/** Old Kingdom context for the plateau (dates as given in the reference work; they vary between chronologies). */
export const DYNASTY4 = [
  { name: 'Sneferu', from: -2613, to: -2589, note: 'Builds the Bent and Red Pyramids at Dahshur; the Meidum pyramid is also attributed to him.' },
  { name: 'Khufu', from: -2589, to: -2566, note: 'Great Pyramid at Giza.', href: '/pharaohs/khufu/' },
  { name: 'Djedefre', from: -2566, to: -2558, note: 'Pyramid at Abu Rawash, several kilometres north of Giza.' },
  { name: 'Khafre', from: -2558, to: -2532, note: 'Second pyramid; the Sphinx is usually attributed to him.', href: '/pharaohs/khafre/' },
  { name: 'Menkaure', from: -2532, to: -2503, note: 'Third pyramid, left unfinished at his death.', href: '/pharaohs/menkaure/' },
  { name: 'Shepseskaf', from: -2503, to: -2498, note: 'Completes Menkaure\'s complex; builds a mastaba tomb (Mastabat al-Fir\'aun), not a pyramid.' },
];
