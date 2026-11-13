import { z } from "zod";
import { ACTION_IDS, CAMERA_IDS, CHARACTER_IDS, ENV_IDS, FORMAT_IDS, GENERIC_TEMPLATE_IDS, PROP_IDS, TEMPLATE_IDS } from "./catalog.ts";

export const MAX_SCENES = 40;

export const CastMemberSchema = z.object({
  kind: z.enum(CHARACTER_IDS),
  action: z.enum(ACTION_IDS).default("stand"),
});

export const SceneSchema = z.object({
  id: z.string().min(1),
  template: z.enum(TEMPLATE_IDS),
  /** Spoken text for this scene. Also the source of the subtitles. */
  narration: z.string().default(""),
  /** Manual length in seconds. Omit to follow the narration automatically. */
  durationSec: z.number().min(2).max(300).optional(),
  environment: z.enum(ENV_IDS).optional(),
  cast: z.array(CastMemberSchema).max(5).optional(),
  camera: z.enum(CAMERA_IDS).optional(),
  label: z.string().max(70).optional(),
  sublabel: z.string().max(120).optional(),
  prop: z.enum(PROP_IDS).optional(),
  variant: z.string().max(30).optional(),
  /** Narration audio, relative to the project folder (wav / mp3 / m4a). */
  narrationFile: z.string().optional(),
  /** Foley bed: auto picks from the environment. */
  ambience: z.enum(["auto", "wind", "interior", "none"]).default("auto"),
  /** Template-specific parameters (see TEMPLATE_PARAMS). Optional: defaults apply. */
  params: z.record(z.string().max(40), z.union([z.string().max(80), z.boolean()])).optional(),
  /** Production direction notes are descriptive; only supported properties control Remotion. */
  production: z.object({
    sourceNumber: z.number().int().positive(),
    sceneTitle: z.string().max(160),
    chapter: z.string().max(160),
    visual: z.string().max(4000),
    sound: z.string().max(4000),
    estimatedSeconds: z.number().min(0).max(300).optional(),
  }).optional(),
});
export type Scene = z.infer<typeof SceneSchema>;

export const ProjectSchema = z.object({
  version: z.literal(1).default(1),
  title: z.string().min(1).max(120),
  topic: z.string().max(400).default(""),
  script: z.string().default(""),
  format: z.enum(FORMAT_IDS).default("9:16"),
  fps: z.union([z.literal(24), z.literal(25), z.literal(30), z.literal(60)]).default(30),
  subtitles: z.boolean().default(true),
  audio: z
    .object({
      music: z.enum(["generated", "file", "none"]).default("generated"),
      musicFile: z.string().optional(),
      musicVolume: z.number().min(0).max(1).default(0.5),
      musicSeed: z.number().int().default(1881),
      sfx: z.boolean().default(true),
      sfxVolume: z.number().min(0).max(1).default(0.55),
      narrationVolume: z.number().min(0).max(1.5).default(1),
    })
    .prefault({}),
  scenes: z.array(SceneSchema).min(1).max(MAX_SCENES),
});
export type Project = z.infer<typeof ProjectSchema>;

/** What a local model is asked to return: generic templates only, no file paths. */
export const AiSceneSchema = z.object({
  template: z.enum(GENERIC_TEMPLATE_IDS),
  narration: z.string().min(8).max(400),
  environment: z.enum(ENV_IDS).optional(),
  cast: z.array(CastMemberSchema).max(4).optional(),
  camera: z.enum(CAMERA_IDS).optional(),
  label: z.string().max(40).optional(),
  sublabel: z.string().max(80).optional(),
  prop: z.enum(PROP_IDS).optional(),
  variant: z.enum(["intact", "looted"]).optional(),
});
export const AiStoryboardSchema = z.object({
  title: z.string().min(1).max(100),
  scenes: z.array(AiSceneSchema).min(3).max(24),
});
export type AiStoryboard = z.infer<typeof AiStoryboardSchema>;

/** Props handed to the Remotion compositions. */
export type Cue = { from: number; to: number; text: string };
export type SceneRenderProps = {
  scene: Scene;
  format: keyof typeof import("./catalog.ts").FORMATS;
  fps: number;
  durationInFrames: number;
  cues: Cue[];
  subtitles: boolean;
};
