/**
 * Structured content for the Giza cluster: evidence levels, construction
 * theories, open questions and references. Kept as data so the pages, diagrams
 * and source lists stay consistent.
 */

export type Level = 'established' | 'plausible' | 'debated' | 'speculative';

export const LEVELS: Record<Level, { label: string; help: string }> = {
  established: { label: 'Well-supported evidence', help: 'Physical remains, inscriptions or measurements that archaeologists agree on.' },
  plausible: { label: 'Plausible reconstruction', help: 'Consistent with the evidence and widely accepted, but not directly proven.' },
  debated: { label: 'Active scholarly debate', help: 'Proposed by specialists; the evidence is partial or points in different directions.' },
  speculative: { label: 'Speculative or weakly supported', help: 'Contradicted by, or lacking, archaeological evidence. Mentioned so readers can place it.' },
};

export interface Ref { id: string; label: string; url?: string }

/** References used on the Giza pages. Cite by id. */
export const REFS: Record<string, Ref> = {
  petrie: { id: 'petrie', label: 'W. M. F. Petrie, The Pyramids and Temples of Gizeh (London, 1883)', url: 'http://www.ronaldbirdsall.com/gizeh/petrie/index.html' },
  lehner97: { id: 'lehner97', label: 'M. Lehner, The Complete Pyramids (London: Thames & Hudson, 1997)' },
  lehnerHawass: { id: 'lehnerHawass', label: 'M. Lehner and Z. Hawass, Giza and the Pyramids (London: Thames & Hudson, 2017)' },
  lehnerLabor: { id: 'lehnerLabor', label: 'M. Lehner, "Labor and the Pyramids: The Heit el-Ghurab \'Workers Town\' at Giza", in P. Steinkeller and M. Hudson (eds), Labor in the Ancient World (Dresden, 2015), 397–522', url: 'https://www.researchgate.net/publication/303875906_Labor_and_the_Pyramids_The_Heit_el-Ghurab_Workers_Town_at_Giza' },
  aera: { id: 'aera', label: 'Ancient Egypt Research Associates (AERA), "The Lost City of the Pyramid Builders (Heit el-Ghurab)"', url: 'https://aeraweb.org/projects/lost-city/' },
  tallet: { id: 'tallet', label: 'P. Tallet, Les papyrus de la mer Rouge I: le « journal de Merer » (Cairo: IFAO, 2017); P. Tallet and M. Lehner, The Red Sea Scrolls (London: Thames & Hudson, 2021)' },
  sheisha: { id: 'sheisha', label: 'H. Sheisha et al., "Nile waterscapes facilitated the construction of the Giza pyramids during the 3rd millennium BCE", PNAS 119 (2022), e2202530119', url: 'https://doi.org/10.1073/pnas.2202530119' },
  fall: { id: 'fall', label: 'A. Fall et al., "Sliding Friction on Wet and Dry Sand", Physical Review Letters 112 (2014), 175502', url: 'https://doi.org/10.1103/PhysRevLett.112.175502' },
  hatnub: { id: 'hatnub', label: 'University of Liverpool and IFAO (Y. Gourdon, R. Enmarch), "Ancient quarry ramp system may have helped workers build Egypt\'s Great Pyramids" (2018)', url: 'https://news.liverpool.ac.uk/2018/11/02/ancient-quarry-ramp-system-may-have-helped-workers-build-egypts-great-pyramids/' },
  spence: { id: 'spence', label: 'K. Spence, "Ancient Egyptian chronology and the astronomical orientation of pyramids", Nature 408 (2000), 320–324', url: 'https://doi.org/10.1038/35042510' },
  dash: { id: 'dash', label: 'G. Dash, "Occam\'s Egyptian Razor: The Equinox and the Alignment of the Pyramids", Journal of Ancient Egyptian Architecture 2 (2017)', url: 'https://www.academia.edu/31435265/Occam_s_Egyptian_Razor_The_Equinox_and_the_Alignment_of_the_Pyramids' },
  houdin: { id: 'houdin', label: 'J.-P. Houdin, Khufu: The Secrets Behind the Building of the Great Pyramid (Cairo: Farid Atiya Press, 2006)' },
  morishima: { id: 'morishima', label: 'K. Morishima et al., "Discovery of a big void in Khufu\'s Pyramid by observation of cosmic-ray muons", Nature 552 (2017), 386–390', url: 'https://doi.org/10.1038/nature24647' },
  procureur: { id: 'procureur', label: 'S. Procureur et al., "Precise characterization of a corridor-shaped structure in Khufu\'s Pyramid by observation of cosmic-ray muons", Nature Communications 14 (2023), 1144', url: 'https://doi.org/10.1038/s41467-023-36351-0' },
  herodotus: { id: 'herodotus', label: 'Herodotus, Histories II.124–125 (5th century BCE)' },
  lehnerSphinx: { id: 'lehnerSphinx', label: 'M. Lehner, The Egyptian Sphinx: Its Contexts and Its Meaning (PhD thesis, Yale University, 1991); M. Lehner, "Reconstructing the Sphinx", Cambridge Archaeological Journal 2 (1992), 3–26' },
  hawassSphinx: { id: 'hawassSphinx', label: 'Z. Hawass, The Secrets of the Sphinx: Restoration Past and Present (Cairo: AUC Press, 1998)' },
  schoch: { id: 'schoch', label: 'R. M. Schoch, "Redating the Great Sphinx of Giza", KMT 3.2 (1992), 52–59, 66–70' },
  reader: { id: 'reader', label: 'C. D. Reader, "A Geomorphological Study of the Giza Necropolis, with Implications for the Development of the Site", Archaeometry 43 (2001), 149–165', url: 'https://doi.org/10.1111/1475-4754.00009' },
  stadelmann: { id: 'stadelmann', label: 'R. Stadelmann, "The Great Sphinx of Giza", in Z. Hawass (ed.), Egyptology at the Dawn of the Twenty-first Century, vol. 1 (Cairo, 2003), 464–469' },
  maqrizi: { id: 'maqrizi', label: 'al-Maqrizi, al-Mawaʿiz wa-l-Iʿtibar (15th century), on the defacement of the Sphinx by Muhammad Saʾim al-Dahr (1378 CE)' },
  unesco: { id: 'unesco', label: 'UNESCO World Heritage Centre, "Memphis and its Necropolis – the Pyramid Fields from Giza to Dahshur" (1979)', url: 'https://whc.unesco.org/en/list/86/' },
  moa: { id: 'moa', label: 'Egyptian Ministry of Tourism and Antiquities, "Workers\' Town and Cemetery"', url: 'https://egymonuments.gov.eg/en/monuments/workers-town-and-cemetery' },
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
    id: 'quarry', title: 'Quarrying on the plateau and along the Nile', level: 'established',
    summary: 'Most of the core blocks were cut from limestone quarries on the plateau itself, just south of the pyramid. Fine white limestone for the casing came from Tura across the river, and granite for the King\'s Chamber from Aswan, about 800 km upstream.',
    evidence: ['Quarry faces and trenches south of the pyramid match the size of its core blocks.', 'The papyri of the official Merer (year 27 of Khufu) record boat crews carrying Tura limestone to Giza.', 'Tool marks, unfinished blocks and saw and drill marks on granite survive at Giza (recorded by Petrie).'],
    problems: ['How much of the core is local stone versus the natural rock hillock inside the pyramid is not precisely known.'],
    refs: ['lehner97', 'tallet', 'petrie'],
  },
  {
    id: 'transport', title: 'Boats, canals and sledges', level: 'established',
    summary: 'Heavy stone travelled by boat on the Nile and on canals and harbour basins cut close to the plateau, then on wooden sledges over prepared tracks.',
    evidence: ['Merer\'s logbook describes shipments to Giza via a harbour called "She-Khufu".', 'Sediment cores show a Nile branch at high water beside Giza in Khufu\'s time (Sheisha et al. 2022).', 'Sledges are shown in Egyptian art; a Middle Kingdom tomb painting of Djehutihotep shows water poured in front of a sledge carrying a colossus.', 'Laboratory tests show that damp sand can roughly halve the pulling force needed for a sledge (Fall et al. 2014).'],
    problems: ['The exact course of the harbour and canals at Giza is still being mapped.'],
    refs: ['tallet', 'sheisha', 'fall'],
  },
  {
    id: 'workforce', title: 'An organised, fed and housed workforce', level: 'established',
    summary: 'The pyramids were built by organised crews of Egyptians, supported by bakers, brewers, herders and administrators, not by slaves. Crews were divided into named gangs and smaller divisions.',
    evidence: ['The excavated town of Heit el-Ghurab, south of the Wall of the Crow, with bakeries, galleries, workshops and large quantities of cattle, sheep and goat bone.', 'A cemetery of workers and overseers on the slope above the town, with skeletons showing healed fractures and medical care.', 'Builders\' graffiti in the relieving chambers name Khufu\'s work gangs.'],
    problems: ['The number of workers is an estimate: calculations range from a few thousand skilled builders to about 20,000–25,000 people including all support staff.'],
    refs: ['lehnerLabor', 'aera', 'moa', 'lehner97'],
  },
  {
    id: 'straight', title: 'A straight ramp', level: 'debated',
    summary: 'One long ramp of mud brick and rubble built against a face, raised as the pyramid rose.',
    evidence: ['Construction ramps of rubble and mud brick are known from several pyramid sites.', 'Such a ramp works well for the lower courses, where most of the volume lies.'],
    problems: ['At a workable gradient of about 1:10 it would be about 1.5 km long to reach the top, with a volume approaching that of the pyramid itself.', 'No remains of a ramp of that size have been found at Giza.'],
    refs: ['lehner97', 'lehnerHawass'],
  },
  {
    id: 'zigzag', title: 'Zigzag or switchback ramps', level: 'debated',
    summary: 'Ramps climbing one face in legs, turning back on landings.',
    evidence: ['Keeps the ramp short and its material modest.', 'Steep ramps with flanking stairs and post holes for hauling were used in Khufu\'s reign at the Hatnub quarry.'],
    problems: ['Faces become narrow near the top, leaving little room for turns.', 'A ramp resting on the face would bear on the unfinished outer masonry.'],
    refs: ['hatnub', 'lehner97'],
  },
  {
    id: 'spiral', title: 'A ramp wrapping around the pyramid', level: 'debated',
    summary: 'A ramp spiralling around all four faces, sometimes combined with a straight ramp for the lower part.',
    evidence: ['Keeps a steady gradient all the way up.', 'Proposed in several forms, including by Mark Lehner in the 1980s.'],
    problems: ['It would hide the corners and edges that surveyors needed to keep the pyramid true.', 'Hauling crews would have to turn blocks at every corner.'],
    refs: ['lehner97', 'lehnerHawass'],
  },
  {
    id: 'levers', title: 'Levering and lifting devices', level: 'debated',
    summary: 'Blocks raised from course to course with levers, wooden rockers or simple lifting frames, perhaps together with ramps.',
    evidence: ['Herodotus, about 2,000 years later, says the stones were lifted "with machines made of short timbers".', 'Levering is the most practical way to make the final adjustments in placing a block, and experiments show it can raise blocks step by step.'],
    problems: ['No lifting device has been found, and Herodotus was reporting long after the event.', 'Lifting the granite roof beams of the King\'s Chamber, some estimated at up to about 80 tonnes, this way is especially hard to explain.'],
    refs: ['herodotus', 'lehner97'],
  },
  {
    id: 'internal', title: 'An internal ramp', level: 'speculative',
    summary: 'The architect Jean-Pierre Houdin proposed that the upper part was built from a ramp spiralling inside the pyramid, just behind the faces.',
    evidence: ['Offers an answer to the ramp-volume problem.', 'Houdin cites a notch near one corner of the pyramid as a possible opening.'],
    problems: ['No internal ramp has been confirmed; the muon surveys of 2016–2023 found other voids but not a ramp.', 'Most Egyptologists regard the proposal as unproven.'],
    refs: ['houdin', 'morishima'],
  },
  {
    id: 'cast', title: 'Blocks cast from concrete', level: 'speculative',
    summary: 'A proposal (associated with the chemist Joseph Davidovits) that some blocks were cast in place from a limestone-based concrete rather than cut.',
    evidence: ['Would explain the tight joints of some blocks.'],
    problems: ['Blocks contain intact fossils and bedding layers of natural limestone, and match the quarries.', 'The quarries themselves show where the blocks were cut out. Most geologists reject the idea.'],
    refs: ['lehnerHawass'],
  },
];

/** What the evidence shows about the Great Pyramid. */
export const EVIDENCE_SHOWS: { text: string; refs: string[] }[] = [
  { text: 'It was built for Khufu of the 4th Dynasty, around 2560 BCE. His name appears in builders\' graffiti in the relieving chambers, and Merer\'s papyri record work for his pyramid in about year 27 of his reign.', refs: ['lehnerHawass', 'tallet'] },
  { text: 'It was laid out with great precision: a base of 230.35 m per side that is nearly square, with sides aligned to true north to within about 3–4 minutes of arc (Petrie).', refs: ['petrie'] },
  { text: 'Its blocks came from local quarries, from Tura and from Aswan, and were moved by boat and sledge.', refs: ['tallet', 'sheisha', 'lehner97'] },
  { text: 'An organised, well-fed workforce lived in a planned town at the foot of the plateau.', refs: ['lehnerLabor', 'aera'] },
  { text: 'Its chambers and passages were surveyed in detail by Petrie in 1880–82; muon imaging has since found at least two previously unknown voids.', refs: ['petrie', 'morishima', 'procureur'] },
];

/** What remains debated. */
export const DEBATED: { text: string; refs: string[] }[] = [
  { text: 'Which ramp system (or combination of ramps and levering) was used for the upper courses.', refs: ['lehner97'] },
  { text: 'How the granite beams of the King\'s Chamber, some estimated at up to about 80 tonnes, were raised about 43 m above the base.', refs: ['lehner97'] },
  { text: 'How the sides were aligned: by the stars (Spence 2000), by the sun at the equinox (Dash 2017), or by other methods.', refs: ['spence', 'dash'] },
  { text: 'The purpose of the narrow shafts from the King\'s and Queen\'s Chambers: ventilation, symbolic routes for the king\'s spirit, or both.', refs: ['lehnerHawass'] },
  { text: 'What the "Big Void" above the Grand Gallery is: a construction space, a second gallery, or something else.', refs: ['morishima'] },
  { text: 'The size of the workforce and how long construction took. Herodotus says twenty years, a figure broadly compatible with Khufu\'s reign.', refs: ['herodotus', 'lehnerLabor'] },
];

/** The Sphinx: scholarly positions on date and attribution. */
export const SPHINX_POSITIONS: { title: string; level: Level; text: string; refs: string[] }[] = [
  { title: 'Carved for Khafre, about 2500 BCE', level: 'plausible', text: 'The most widely held view. The Sphinx lies beside Khafre\'s causeway and valley temple; its enclosure respects the line of the causeway; the Sphinx Temple in front of it was built from blocks quarried from the same rock layers and is aligned with Khafre\'s valley temple. The face has been compared with statues of Khafre.', refs: ['lehnerSphinx', 'lehnerHawass'] },
  { title: 'Carved for Khufu', level: 'debated', text: 'Rainer Stadelmann argued from details of the headdress and face that the Sphinx represents Khufu, the builder of the Great Pyramid.', refs: ['stadelmann'] },
  { title: 'Carved for Djedefre', level: 'debated', text: 'Vassil Dobrev has suggested that Khufu\'s son Djedefre commissioned it in his father\'s image. This remains a minority view.', refs: ['lehnerHawass'] },
  { title: 'Much older than the pyramids', level: 'speculative', text: 'The geologist Robert Schoch argued in 1991–92 that deep weathering of the enclosure walls was caused by rainfall, implying an age thousands of years older. Most Egyptologists and many geologists reject this: the weathering can be explained by the soft, layered limestone, salt crystallisation and later exposure, and no trace of an earlier culture capable of such a work has been found at Giza.', refs: ['schoch', 'reader', 'lehnerHawass'] },
];

/** Old Kingdom context for the plateau (dates follow the chronology used on this site). */
export const DYNASTY4 = [
  { name: 'Sneferu', from: -2613, to: -2589, note: 'Builds the pyramids of Meidum and Dahshur; perfects the true pyramid.' },
  { name: 'Khufu', from: -2589, to: -2566, note: 'Great Pyramid at Giza.', href: '/pharaohs/khufu/' },
  { name: 'Djedefre', from: -2566, to: -2558, note: 'Pyramid at Abu Rawash, north of Giza.' },
  { name: 'Khafre', from: -2558, to: -2532, note: 'Second pyramid; the Sphinx is usually attributed to him.', href: '/pharaohs/khafre/' },
  { name: 'Menkaure', from: -2532, to: -2503, note: 'Third pyramid; the workers\' town is in use.', href: '/pharaohs/menkaure/' },
  { name: 'Shepseskaf', from: -2503, to: -2498, note: 'Mastaba tomb at Saqqara; the Giza building programme ends.' },
];
