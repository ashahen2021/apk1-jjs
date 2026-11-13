import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./paths.ts";

// FFmpeg ships inside Remotion (`remotion ffmpeg`), so nothing extra has to be
// installed on Windows. Set FFMPEG_PATH / FFPROBE_PATH to use another build.
const CLI = path.join(ROOT, "node_modules", "@remotion", "cli", "remotion-cli.js");

const run = (tool: "ffmpeg" | "ffprobe", args: string[]) =>
  new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const custom = process.env[tool === "ffmpeg" ? "FFMPEG_PATH" : "FFPROBE_PATH"];
    const child = custom ? spawn(custom, args) : spawn(process.execPath, [CLI, tool, ...args]);
    let stdout = "", stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`${tool} failed (exit ${code}): ${stderr.split("\n").slice(-6).join("\n")}`))));
  });

export const ffmpeg = (args: string[]) => run("ffmpeg", ["-hide_banner", "-y", ...args]);
export const ffprobe = (args: string[]) => run("ffprobe", args);

export const probe = async (file: string) => {
  const { stdout } = await ffprobe(["-v", "error", "-count_frames", "-show_streams", "-show_format", "-of", "json", file]);
  return JSON.parse(stdout) as { streams: Record<string, string>[]; format: Record<string, string> };
};

export const fileExists = (f: string) => { try { return fs.statSync(f).isFile(); } catch { return false; } };
