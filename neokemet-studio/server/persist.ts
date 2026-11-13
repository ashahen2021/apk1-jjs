// Crash-safe file writes for project data.
//
// A project file is never written in place. The new content goes to a temporary
// file in the same folder, is flushed to disk and read back, and only then
// replaces the real file with a single rename. If anything fails before the
// rename, the existing file is untouched. The version being replaced is kept
// beside it as "<name>.bak", so one step back is always recoverable.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const backupPathOf = (file: string) => file + ".bak";

/** Test hook: lets the self-test interrupt a save at a chosen step. Never set in normal use. */
export type SaveFault = "after-temp-write" | "after-backup" | "on-rename";
type Options = { backup?: boolean; fault?: SaveFault; verify?: (text: string) => void };

const renameWithRetry = (from: string, to: string) => {
  // On Windows a virus scanner or indexer can hold the target open for a moment.
  for (let attempt = 0; ; attempt++) {
    try { return fs.renameSync(from, to); }
    catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (attempt >= 5 || !["EPERM", "EBUSY", "EACCES"].includes(code ?? "")) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 40 * (attempt + 1));
    }
  }
};

/**
 * Replace `file` with `text` atomically. Returns the backup path when the
 * previous version was preserved. Throws without changing `file` on any failure.
 */
export const writeFileAtomic = (file: string, text: string, opts: Options = {}): { backup: string | null } => {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(file)}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`);
  let backup: string | null = null;
  try {
    const fd = fs.openSync(tmp, "wx");
    try { fs.writeFileSync(fd, text, "utf8"); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    // Read back what actually reached the disk before trusting it.
    const written = fs.readFileSync(tmp, "utf8");
    if (written !== text) throw new Error("the temporary file does not match what was written");
    opts.verify?.(written);
    if (opts.fault === "after-temp-write") throw new Error("simulated failure after writing the temporary file");
    if (opts.backup !== false && fs.existsSync(file)) {
      const bakTmp = tmp + ".bak";
      fs.copyFileSync(file, bakTmp);
      renameWithRetry(bakTmp, backupPathOf(file));
      backup = backupPathOf(file);
    }
    if (opts.fault === "after-backup") throw new Error("simulated failure after saving the backup");
    if (opts.fault === "on-rename") throw new Error("simulated failure while replacing the file");
    renameWithRetry(tmp, file);
    return { backup };
  } catch (e) {
    for (const leftover of [tmp, tmp + ".bak"]) { try { fs.rmSync(leftover, { force: true }); } catch { /* nothing to clean */ } }
    throw new Error(`Could not save ${path.basename(file)}: ${e instanceof Error ? e.message : String(e)}. The previous version was left unchanged.`);
  }
};

/** Temporary files left behind by a save that was killed mid-way (power loss, crash). */
export const staleTempFiles = (dir: string, name: string) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.startsWith(`.${name}.`) && (f.endsWith(".tmp") || f.endsWith(".tmp.bak"))).map((f) => path.join(dir, f)) : [];

/**
 * A file name in `dir` that does not exist yet: "name.ext", then "name-2.ext",
 * "name-3.ext"… Used so an upload can never replace audio that is already there.
 */
export const freeFileName = (dir: string, name: string) => {
  const ext = path.extname(name), stem = name.slice(0, name.length - ext.length);
  let candidate = name;
  for (let n = 2; fs.existsSync(path.join(dir, candidate)); n++) candidate = `${stem}-${n}${ext}`;
  return candidate;
};

export const sha256File = (file: string) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
export const sha256Text = (text: string) => crypto.createHash("sha256").update(text, "utf8").digest("hex");
