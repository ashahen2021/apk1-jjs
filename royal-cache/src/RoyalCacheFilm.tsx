import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { AnimatedScene } from "./components/AnimatedScene";
import { PrintOverlay } from "./components/PrintOverlay";
import { Subtitles } from "./components/Subtitles";
import { ensureFonts } from "./lib/fonts";
import { C, LEAD, SCENE_FRAMES } from "./lib/theme";
import { SCENES } from "./scenes";

ensureFonts();

export type FilmProps = {
  subtitles: boolean;
  voiceover: boolean;
  music: boolean;
  foley: boolean;
  voVolume: number;
  musicVolume: number;
  foleyVolume: number;
};

export const defaultFilmProps: FilmProps = {
  subtitles: true,
  voiceover: true,
  music: true,
  foley: true,
  voVolume: 1,
  musicVolume: 0.55,
  foleyVolume: 0.6,
};

export const RoyalCacheFilm: React.FC<FilmProps> = (p) => (
  <AbsoluteFill style={{ backgroundColor: C.paper }}>
    {SCENES.map((s, i) => (
      // Mounted LEAD frames early and held LEAD frames late: the dissolve is
      // centred exactly on the stated timestamp and no frame is ever blank.
      <Sequence key={s.id} name={`${String(s.id).padStart(2, "0")} ${s.title}`} from={i * SCENE_FRAMES - LEAD} durationInFrames={SCENE_FRAMES + LEAD * 2}>
        <AnimatedScene index={i} bg={s.bg}>
          <s.Component />
        </AnimatedScene>
      </Sequence>
    ))}
    <PrintOverlay />
    {p.subtitles && <Subtitles />}
    {p.voiceover && <Audio src={staticFile("audio/royal-cache-vo.wav")} volume={p.voVolume} />}
    {p.music && <Audio src={staticFile("audio/music.wav")} volume={p.musicVolume} />}
    {p.foley && <Audio src={staticFile("audio/foley.wav")} volume={p.foleyVolume} />}
  </AbsoluteFill>
);
