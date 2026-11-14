// NeoKemetAI Animation Studio — browser UI (plain JavaScript, no build step).
const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else if (v !== undefined && v !== false) n.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat()) if (k !== null && k !== undefined) n.append(k.nodeType ? k : document.createTextNode(String(k)));
  return n;
};
const api = async (path, opts = {}) => {
  const res = await fetch(path, opts);
  const type = res.headers.get("content-type") || "";
  if (!res.ok) throw new Error(type.includes("json") ? (await res.json()).error : `Request failed (${res.status})`);
  return type.includes("json") ? res.json() : res.blob();
};
const post = (path, data) => api(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });

let catalog, project, slug, dirty = false, timeline = null, settings;
const thumbs = {}; // scene id → object URL
let smartDraft = null; // suggestions from the most recently analyzed project
let smartUndo = null;  // only template/params for the latest approved batch
const smartImages = [];
const clearSmartDraft = () => {
  smartDraft = null;
  for (const url of smartImages.splice(0)) URL.revokeObjectURL(url);
  if ($("smartSelectionPreview")) {
    $("smartSelectionPreview").hidden = true;
    $("smartSelectionPreview").replaceChildren();
    $("btnApplySmart").disabled = true;
  }
  if ($("smartSelectionState")) $("smartSelectionState").textContent = "Uses existing visual-direction rules — no AI credits.";
};
const resetSmartProject = () => {
  clearSmartDraft();
  smartUndo = null;
  if ($("btnUndoSmart")) $("btnUndoSmart").disabled = true;
};

const say = (msg, ok = false) => { const b = $("banner"); b.hidden = !msg; b.textContent = msg || ""; b.className = "banner" + (ok ? " ok" : ""); if (ok && msg) setTimeout(() => { if (b.textContent === msg) b.hidden = true; }, 6000); };
const fail = (e) => say(e.message || String(e));
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "project";
const markDirty = () => { dirty = true; $("saved").textContent = "Unsaved changes"; clearSmartDraft(); };
const options = (obj, sel, blank) => [blank ? el("option", { value: "" }, blank) : null, ...Object.entries(obj).map(([k, v]) => el("option", { value: k, selected: k === sel }, typeof v === "string" ? v : v.label))];

const blankProject = (title) => ({ version: 1, title, topic: "", script: "", format: "9:16", fps: 30, subtitles: true, audio: { music: "generated", musicVolume: 0.5, musicSeed: 1881, sfx: true, sfxVolume: 0.55, narrationVolume: 1 }, scenes: [{ id: "s01", template: "title", environment: "giza-pyramids", label: title, narration: "", camera: "push-in", ambience: "auto" }] });

// ---------- jobs ----------
const runJob = async (id, onTick) => {
  for (;;) {
    const j = await api(`/api/jobs/${id}`);
    onTick?.(j);
    if (j.status === "done") return j.result;
    if (j.status === "error") throw new Error(j.error);
    await new Promise((r) => setTimeout(r, 600));
  }
};
const showJob = (j) => { $("job").hidden = false; $("jobBar").style.width = j.percent + "%"; $("jobMsg").textContent = j.status === "queued" ? "Waiting for the previous task…" : `${j.percent}% — ${j.message}`; };

// ---------- projects ----------
const refreshProjects = async () => {
  const list = await api("/api/projects");
  $("projectList").replaceChildren(...list.map((p) => el("li", { class: p.slug === slug ? "on" : "", onclick: () => openProject(p.slug) }, p.title, el("small", {}, `${p.scenes} scenes · ${p.format}`))));
  return list;
};
const openProject = async (s) => {
  if (dirty && !confirm("Discard unsaved changes?")) return;
  try { project = await api(`/api/projects/${s}`); slug = s; resetSmartProject(); window.resetVisualLab?.(); dirty = false; $("saved").textContent = ""; for (const k in thumbs) delete thumbs[k]; fill(); await refreshProjects(); refreshTimeline(); say(""); } catch (e) { fail(e); }
};
const save = async () => {
  try { project = await api(`/api/projects/${slug}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(project) }); dirty = false; $("saved").textContent = "Saved"; await refreshProjects(); } catch (e) { fail(e); throw e; }
};

// ---------- form binding ----------
const bind = (id, get, set, ev = "input") => { const n = $(id); n.addEventListener(ev, () => { set(n.type === "checkbox" ? n.checked : n.type === "number" || n.type === "range" ? Number(n.value) : n.value); markDirty(); }); n._get = get; };
const fill = () => {
  for (const n of document.querySelectorAll("[id]")) if (n._get) { const v = n._get(); if (n.type === "checkbox") n.checked = !!v; else n.value = v ?? ""; }
  $("musicName").textContent = project.audio.musicFile || "";
  renderScenes();
};
const refreshTimeline = async () => {
  if (!project) return;
  try {
    timeline = await post(`/api/projects/${slug}/timeline`, { project });
    const mm = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
    $("timelineBox").replaceChildren(el("b", {}, `Film length: ${mm(timeline.seconds)} (${timeline.totalFrames} frames) · ${project.scenes.length} scenes`), ...timeline.warnings.map((w) => el("div", { class: "muted" }, "• " + w)));
    $("sbSummary").textContent = `${project.scenes.length} scenes · ${mm(timeline.seconds)} total`;
    document.querySelectorAll(".scene").forEach((n, i) => { const t = timeline.scenes[i]; const m = n.querySelector(".meta"); if (t && m) m.textContent = `${t.seconds.toFixed(1)} s · voice ${t.narrationSec.toFixed(1)} s ${t.estimated ? "(estimated)" : "(measured from audio)"}`; });
  } catch (e) { $("timelineBox").textContent = e.message; }
};
let tlTimer; const touch = () => { markDirty(); clearTimeout(tlTimer); tlTimer = setTimeout(refreshTimeline, 500); };

// ---------- storyboard ----------
const preview = async (i, box) => {
  box.replaceChildren(el("span", {}, "Rendering preview…"));
  try { const blob = await api(`/api/projects/${slug}/preview?scene=${i}&at=0.6`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ project }) }); thumbs[project.scenes[i].id] = URL.createObjectURL(blob); box.replaceChildren(el("img", { src: thumbs[project.scenes[i].id] })); } catch (e) { box.replaceChildren(el("span", {}, e.message)); }
};
const renderScenes = () => {
  const uses = (s, f) => catalog.TEMPLATES[s.template].uses.includes(f);
  $("scenes").replaceChildren(...project.scenes.map((s, i) => {
    const set = (k, v) => { if (v === "" || v === undefined) delete s[k]; else s[k] = v; touch(); };
    const thumb = el("div", { class: "thumb" }, thumbs[s.id] ? el("img", { src: thumbs[s.id] }) : el("span", {}, "No preview yet"));
    const paramDefs = (t) => (catalog.TEMPLATE_PARAMS || {})[t] || [];
    const tpl = el("select", { onchange: (e) => {
      s.template = e.target.value;
      // start a template's own parameters from their defaults; drop them for templates without any
      const defs = paramDefs(s.template);
      if (defs.length) s.params = Object.fromEntries(defs.map((d) => [d.key, d.default])); else delete s.params;
      touch(); renderScenes();
    } });
    for (const g of ["Generic", "Documentary", "Royal Cache presets"]) tpl.append(el("optgroup", { label: g }, ...Object.entries(catalog.TEMPLATES).filter(([, t]) => t.group === g).map(([k, t]) => el("option", { value: k, selected: k === s.template }, t.label))));
    const fields = [el("label", {}, "Template", tpl)];
    if (uses(s, "environment")) fields.push(el("label", {}, "Environment", el("select", { onchange: (e) => set("environment", e.target.value) }, options(catalog.ENVIRONMENTS, s.environment, "(default)"))));
    if (uses(s, "camera")) fields.push(el("label", {}, "Camera", el("select", { onchange: (e) => set("camera", e.target.value) }, options(catalog.CAMERAS, s.camera, "(default)"))));
    if (uses(s, "prop")) fields.push(el("label", {}, "Object", el("select", { onchange: (e) => set("prop", e.target.value) }, options(catalog.PROPS, s.prop, "(default)"))));
    if (uses(s, "variant")) fields.push(el("label", {}, "State", el("select", { onchange: (e) => set("variant", e.target.value) }, (catalog.TEMPLATES[s.template].variants || []).map((v) => el("option", { value: v, selected: v === s.variant }, v)))));
    for (const d of paramDefs(s.template)) {
      const cur = s.params && s.params[d.key] !== undefined ? s.params[d.key] : d.default;
      const setP = (v) => { s.params = { ...(s.params || {}), [d.key]: v }; touch(); };
      if (d.type === "boolean") fields.push(el("label", { class: "check" }, el("input", { type: "checkbox", checked: !!cur, "data-param": d.key, onchange: (e) => setP(e.target.checked) }), d.label));
      else fields.push(el("label", {}, d.label, el("select", { "data-param": d.key, onchange: (e) => setP(e.target.value) }, d.options.map((o) => el("option", { value: o, selected: o === cur }, o)))));
    }
    if (uses(s, "label")) fields.push(el("label", {}, paramDefs(s.template).length ? "Label" : "On-screen label", el("input", { value: s.label || "", maxlength: 70, oninput: (e) => set("label", e.target.value) })));
    if (uses(s, "sublabel")) fields.push(el("label", {}, s.template === "map" ? "Places: A | B | C" : paramDefs(s.template).length ? "Subtitle" : "Second line", el("input", { value: s.sublabel || "", maxlength: 120, oninput: (e) => set("sublabel", e.target.value) })));
    fields.push(el("label", {}, "Length (seconds, blank = follow narration)", el("input", { type: "number", min: 2, max: 300, step: 0.5, value: s.durationSec ?? "", oninput: (e) => set("durationSec", e.target.value ? Number(e.target.value) : undefined) })));
    if (uses(s, "cast")) {
      s.cast = s.cast || [];
      const cast = el("div", { class: "cast" }, el("b", {}, "Characters:"), ...s.cast.map((m, k) => el("span", { class: "member" },
        el("select", { onchange: (e) => { m.kind = e.target.value; touch(); } }, options(catalog.CHARACTERS, m.kind)),
        el("select", { onchange: (e) => { m.action = e.target.value; touch(); } }, options(catalog.ACTIONS, m.action)),
        el("button", { class: "small", onclick: () => { s.cast.splice(k, 1); touch(); renderScenes(); } }, "×"))),
        s.cast.length < 5 ? el("button", { class: "small", onclick: () => { s.cast.push({ kind: "priest", action: "stand" }); touch(); renderScenes(); } }, "+ character") : null);
      fields.push(cast);
    }
    if (s.production) {
      const p = s.production;
      fields.push(el("details", { class: "production-notes" },
        el("summary", {}, `Production notes · ${p.sceneTitle || "Scene"}${p.chapter ? " · " + p.chapter : ""}`),
        el("label", {}, "Visual direction (editable)", el("textarea", { rows: 2, oninput: (e) => { p.visual = e.target.value; touch(); } }, p.visual || "")),
        el("label", {}, "Sound / transition direction (editable)", el("textarea", { rows: 2, oninput: (e) => { p.sound = e.target.value; touch(); } }, p.sound || "")),
        el("div", { class: "muted" }, "These notes are not spoken. Unsupported directions need manual visual editing.")
      ));
    }
    fields.push(el("textarea", { rows: 3, placeholder: "Narration for this scene (also used for the subtitles)", oninput: (e) => { s.narration = e.target.value; touch(); } }, s.narration || ""));
    const file = el("input", { type: "file", accept: "audio/*,.wav,.mp3,.m4a", hidden: true, onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { const r = await api(`/api/projects/${slug}/upload?kind=narration&name=${encodeURIComponent(String(i + 1).padStart(2, "0") + "-" + f.name)}`, { method: "POST", body: f }); s.narrationFile = r.file; touch(); renderScenes(); refreshTimeline(); } catch (err) { fail(err); } } });
    return el("div", { class: "scene" },
      el("div", { class: "side" }, thumb,
        el("button", { class: "small", onclick: () => preview(i, thumb) }, "Preview frame"),
        el("button", { class: "small", onclick: () => exportVideo(i) }, "Render this scene")),
      el("div", {},
        el("div", { class: "head" }, el("b", {}, `Scene ${i + 1}`), el("span", { class: "meta" }), el("span", { class: "sp" }),
          el("button", { class: "small", disabled: i === 0, onclick: () => { project.scenes.splice(i - 1, 0, project.scenes.splice(i, 1)[0]); touch(); renderScenes(); } }, "↑"),
          el("button", { class: "small", disabled: i === project.scenes.length - 1, onclick: () => { project.scenes.splice(i + 1, 0, project.scenes.splice(i, 1)[0]); touch(); renderScenes(); } }, "↓"),
          el("button", { class: "small", onclick: () => { const c = JSON.parse(JSON.stringify(s)); c.id = newId(); delete c.narrationFile; project.scenes.splice(i + 1, 0, c); touch(); renderScenes(); } }, "Duplicate"),
          el("button", { class: "small danger", disabled: project.scenes.length === 1, onclick: () => { project.scenes.splice(i, 1); touch(); renderScenes(); } }, "Delete")),
        el("div", { class: "muted" }, catalog.TEMPLATES[s.template].description),
        el("div", { class: "fields" }, fields),
        el("div", { class: "row" }, el("label", { class: "filebtn" }, "Import narration audio", file), el("span", { class: "muted" }, s.narrationFile ? `Audio: ${s.narrationFile}` : "No audio yet — length is estimated from the text"),
          s.narrationFile ? el("button", { class: "small", onclick: () => { delete s.narrationFile; touch(); renderScenes(); } }, "Remove audio") : null)));
  }));
  refreshTimeline();
};
const newId = () => { let n = project.scenes.length + 1; while (project.scenes.some((s) => s.id === "s" + String(n).padStart(2, "0"))) n++; return "s" + String(n).padStart(2, "0"); };


// ---------- Production Match Check (report only; never edits the project) ----------
const INTENT_NAMES = { validated: "Validated match", unsupported: "Unsupported direction", review: "Requires human review", "no-direction": "No direction to check" };
const checkProductionIntent = async () => {
  if (!project) return;
  const btn = $("btnCheckIntent"), box = $("intentResults");
  btn.disabled = true;
  $("intentState").textContent = "Checking visual directions…";
  try {
    const report = await post("/api/intent/preview", { project });
    const s = report.summary;
    $("intentState").textContent = `${s.validated} validated · ${s.unsupported} unsupported · ${s.review} need review · ${s["no-direction"]} without direction`;
    const order = { unsupported: 0, review: 1, validated: 2, "no-direction": 3 };
    const rows = report.scenes.filter((x) => x.status !== "no-direction").sort((a, b) => order[a.status] - order[b.status] || a.index - b.index);
    box.replaceChildren(
      el("p", { class: "smart-note" }, "Nothing was changed. To act on a warning, edit that scene's template or its visual direction yourself, then check again."),
      ...(rows.length ? rows : [{ status: "no-direction", index: 0, sceneTitle: "", message: "No scene in this project has a visual direction, so there is nothing to check." }]).map((x) =>
        el("div", { class: "intent-row intent-" + x.status },
          el("span", { class: "intent-badge" }, INTENT_NAMES[x.status]),
          el("div", { class: "intent-body" },
            x.index ? el("div", { class: "smart-choice-name" }, "Scene " + x.index + " — " + x.sceneTitle) : "",
            el("div", { class: "smart-choice-reason" }, x.message),
            x.soundNotPerformed && x.soundNotPerformed.length ? el("div", { class: "muted" }, "Sound note not performed by the audio engine: " + x.soundNotPerformed.join(", ")) : ""
          )
        )
      )
    );
    box.hidden = false;
  } catch (e) { $("intentState").textContent = ""; say(e.message || String(e)); }
  finally { btn.disabled = false; }
};

// ---------- Smart Template Selection (review only until approval) ----------
const smartCompareFrame = async (suggestion, mode, holder) => {
  const session = smartDraft;
  if (!session || session.slug !== slug || session.signature !== JSON.stringify(project)) {
    say("Project changed. Analyze scenes again before previewing.");
    return;
  }
  holder.replaceChildren(el("span", { class: "muted" }, "Rendering frame locally…"));
  try {
    const candidate = JSON.parse(JSON.stringify(project));
    if (mode === "proposed") {
      const scene = candidate.scenes.find((x) => x.id === suggestion.sceneId);
      if (!scene) throw new Error("This scene is no longer in the storyboard.");
      scene.template = suggestion.proposedTemplate;
      scene.params = { ...suggestion.proposedParams };
    }
    const blob = await api("/api/projects/" + encodeURIComponent(slug) + "/preview?scene=" + (suggestion.index - 1) + "&at=0.6", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ project: candidate }),
    });
    if (smartDraft !== session || session.signature !== JSON.stringify(project)) return;
    const url = URL.createObjectURL(blob);
    smartImages.push(url);
    holder.replaceChildren(el("b", {}, mode === "proposed" ? "Suggested frame" : "Current frame"), el("img", { src: url, alt: mode + " scene preview" }));
  } catch (e) {
    holder.replaceChildren(el("span", { class: "muted" }, e.message || String(e)));
  }
};

const displaySmartSuggestions = (response, signature) => {
  const suggestions = response.suggestions;
  const selected = new Set();
  smartDraft = { slug, signature, suggestions, selected };
  const preview = $("smartSelectionPreview");
  preview.hidden = false;
  const tools = el("div", { class: "smart-tools" });
  const items = el("div", {});
  const count = el("span", { class: "muted" }, "0 selected");
  const update = () => {
    count.textContent = selected.size + " selected";
    $("btnApplySmart").disabled = selected.size === 0;
  };
  const allBtn = el("button", { type: "button", class: "small", onclick: () => {
    selected.clear();
    suggestions.forEach((s) => selected.add(s.sceneId));
    items.querySelectorAll("input[data-smart-id]").forEach((n) => { n.checked = true; });
    update();
  } }, "Select all suggestions");
  const clearBtn = el("button", { type: "button", class: "small", onclick: () => {
    selected.clear();
    items.querySelectorAll("input[data-smart-id]").forEach((n) => { n.checked = false; });
    update();
  } }, "Clear selection");
  tools.append(allBtn, clearBtn, count);
  for (const s of suggestions) {
    const chosen = el("input", { type: "checkbox", "data-smart-id": s.sceneId, "aria-label": "Approve Scene " + s.index, onchange: (e) => {
      if (e.target.checked) selected.add(s.sceneId); else selected.delete(s.sceneId);
      update();
    } });
    const fromLabel = catalog.TEMPLATES[s.currentTemplate]?.label || s.currentTemplate;
    const toLabel = catalog.TEMPLATES[s.proposedTemplate]?.label || s.proposedTemplate;
    const currentFrame = el("div", { class: "smart-still" }, "Current frame not rendered");
    const proposedFrame = el("div", { class: "smart-still" }, "Suggested frame not rendered");
    const frames = el("div", { class: "smart-still-list" }, currentFrame, proposedFrame);
    const compareActions = el("div", { class: "row smart-choice-preview" },
      el("button", { class: "small", type: "button", onclick: () => smartCompareFrame(s, "current", currentFrame) }, "Preview current"),
      el("button", { class: "small", type: "button", onclick: () => smartCompareFrame(s, "proposed", proposedFrame) }, "Preview suggested")
    );
    items.append(el("div", { class: "smart-choice" },
      chosen,
      el("div", { class: "smart-choice-body" },
        el("div", { class: "smart-choice-name" }, "Scene " + s.index + " — " + s.sceneTitle),
        el("div", { class: "smart-choice-fromto" }, fromLabel + " → ", el("strong", {}, toLabel)),
        el("div", { class: "smart-choice-reason" }, s.reason + " (" + s.confidence + " confidence; rule-based)"),
        compareActions, frames
      )
    ));
  }
  preview.replaceChildren(
    el("b", {}, response.summary.total + " scenes reviewed · " + suggestions.length + " proposed changes"),
    el("p", { class: "smart-note" }, response.summary.protected + " protected (title, ending, or already-specialized templates); " +
      response.summary.withoutVisual + " without production visual notes; " + response.summary.unchanged + " without a safe new match."),
    el("p", { class: "smart-note" }, "No files are changed by analysis or frame previews. Proposals modify ONLY template and template parameters. Existing narration, audio, labels, camera, timing and production notes are preserved."),
    suggestions.length ? tools : el("p", { class: "muted" }, "No safe template changes found. Current choices remain unchanged."),
    items
  );
  update();
};

const analyzeSmartSelection = async () => {
  const btn = $("btnAnalyzeSmart");
  const signature = JSON.stringify(project), analyzedSlug = slug;
  btn.disabled = true;
  clearSmartDraft();
  $("smartSelectionState").textContent = "Analyzing visual directions…";
  try {
    const result = await post("/api/smart-selection/preview", { project });
    if (analyzedSlug !== slug || signature !== JSON.stringify(project)) throw new Error("The project changed during analysis. Run Analyze again.");
    displaySmartSuggestions(result, signature);
    $("smartSelectionState").textContent = result.suggestions.length + " changes suggested; select which ones to approve.";
  } catch (e) { say(e.message || String(e)); clearSmartDraft(); }
  finally { btn.disabled = false; }
};

const applySmartSelection = async () => {
  const session = smartDraft;
  if (!session || !session.selected.size) return;
  if (session.slug !== slug || session.signature !== JSON.stringify(project)) {
    clearSmartDraft(); say("The project changed. Please analyze scenes again."); return;
  }
  const ids = Array.from(session.selected);
  if (!confirm("Apply " + ids.length + " template suggestions? Only template and its parameters will change. Narration, audio, durations, on-screen text, and production notes will be kept. Save project after previewing.")) return;
  const button = $("btnApplySmart");
  button.disabled = true;
  try {
    const original = JSON.parse(JSON.stringify(project));
    const result = await post("/api/smart-selection/apply", { project, sceneIds: ids });
    if (session !== smartDraft || session.slug !== slug || session.signature !== JSON.stringify(project)) throw new Error("Project changed during approval. No changes were applied.");
    if (result.changedIds.length !== ids.length) throw new Error("The server returned an incomplete set of changes.");
    const entries = result.changedIds.map((id) => {
      const oldScene = original.scenes.find((s) => s.id === id), newScene = result.project.scenes.find((s) => s.id === id);
      if (!oldScene || !newScene) throw new Error("The scene list changed during approval.");
      return {
        id, beforeTemplate: oldScene.template, hadParams: Object.prototype.hasOwnProperty.call(oldScene, "params"),
        beforeParams: oldScene.params === undefined ? null : JSON.parse(JSON.stringify(oldScene.params)),
        appliedTemplate: newScene.template, appliedParams: newScene.params === undefined ? null : JSON.parse(JSON.stringify(newScene.params)),
      };
    });
    project = result.project;
    smartUndo = { slug, entries };
    $("btnUndoSmart").disabled = false;
    for (const k in thumbs) delete thumbs[k];
    markDirty(); fill();
    say("Applied " + ids.length + " approved template changes. Review frames, then click Save project. You may undo the batch in this session.", true);
  } catch (e) {
    say("No changes were applied. " + (e.message || String(e)));
  } finally { button.disabled = !smartDraft || !smartDraft.selected.size; }
};

const undoSmartSelection = async () => {
  if (!smartUndo || smartUndo.slug !== slug) return;
  const candidate = JSON.parse(JSON.stringify(project));
  let restored = 0, skipped = 0;
  for (const item of smartUndo.entries) {
    const scene = candidate.scenes.find((s) => s.id === item.id);
    if (!scene || scene.template !== item.appliedTemplate ||
        JSON.stringify(scene.params ?? null) !== JSON.stringify(item.appliedParams)) { skipped++; continue; }
    scene.template = item.beforeTemplate;
    if (item.hadParams) scene.params = JSON.parse(JSON.stringify(item.beforeParams));
    else delete scene.params;
    restored++;
  }
  if (!restored) {
    smartUndo = null; $("btnUndoSmart").disabled = true;
    say("Nothing could be safely undone: those templates were manually edited afterward.");
    return;
  }
  try {
    await post("/api/projects/" + encodeURIComponent(slug) + "/timeline", { project: candidate });
    project = candidate;
    smartUndo = null;
    $("btnUndoSmart").disabled = true;
    for (const k in thumbs) delete thumbs[k];
    markDirty(); fill();
    say("Restored " + restored + " templates from the previous selection." +
      (skipped ? " Skipped " + skipped + " manually changed scenes." : "") +
      " Click Save project to persist the undo.", true);
  } catch (e) { say("Undo could not be validated; project remains unchanged. " + (e.message || String(e))); }
};

// ---------- actions ----------
const exportVideo = async (scene) => {
  try {
    await save(); say("");
    document.querySelector('[data-tab="export"]').click();
    $("result").hidden = true;
    const { job } = await post(`/api/projects/${slug}/render${scene === undefined ? "" : `?scene=${scene}`}`, { project });
    const r = await runJob(job, showJob);
    showJob({ percent: 100, message: "Done", status: "done" });
    const url = `/output/${encodeURIComponent(r.name)}?t=${Date.now()}`;
    $("result").hidden = false;
    $("result").replaceChildren(el("b", {}, r.name), el("div", { class: "muted" }, `${r.info.width}×${r.info.height} · ${r.info.fps} fps · ${r.info.frames} frames · ${r.info.seconds.toFixed(2)} s · ${(r.info.bytes / 1e6).toFixed(1)} MB · ${r.rendered} scenes rendered, ${r.reused} reused · took ${r.tookSec.toFixed(0)} s`), ...r.warnings.map((w) => el("div", { class: "muted" }, "• " + w)), el("div", { class: "row" }, el("video", { src: url, controls: true }), el("div", {}, el("a", { href: url, download: r.name }, "Download MP4"), el("div", { class: "muted" }, `Saved in: ${status.outputDir}`))));
    loadOutputs();
  } catch (e) { fail(e); }
};
const narrate = async (provider) => {
  if (provider === "elevenlabs" && !confirm("ElevenLabs is a paid cloud service. Your narration text will be sent to ElevenLabs and billed to your account. Continue?")) return;
  try {
    await save(); say("");
    $(provider === "piper" ? "piperState" : "ollamaState").textContent = "";
    const { job } = await post(`/api/projects/${slug}/narrate?provider=${provider}`, { project });
    const r = await runJob(job, (j) => { $("piperState").textContent = j.status === "running" ? `${j.percent}% — ${j.message}` : ""; });
    project = r.project; dirty = false; fill();
    const notes = [];
    if (r.reused) notes.push(`${r.reused} reused from audio already in this project`);
    if (r.keptUnverified && r.keptUnverified.length) notes.push(`scenes ${r.keptUnverified.join(", ")} kept their existing audio (no record of its text; nothing was replaced)`);
    if (r.voiceDiffers && r.voiceDiffers.length) notes.push(`scenes ${r.voiceDiffers.join(", ")} were recorded with a different voice or settings`);
    say(`Narration ready: ${r.made} generated, ${r.total - r.made - (r.reused || 0)} already up to date.${notes.length ? "\n" + notes.join("; ") + "." : ""}`, true); $("piperState").textContent = "";
  } catch (e) { fail(e); $("piperState").textContent = ""; }
};
const loadOutputs = async () => {
  const list = await api("/api/outputs");
  $("outputs").replaceChildren(...(list.length ? list.map((o) => el("li", {}, el("a", { href: `/output/${encodeURIComponent(o.name)}`, target: "_blank" }, o.name), el("span", { class: "muted" }, `${(o.bytes / 1e6).toFixed(1)} MB · ${new Date(o.mtime).toLocaleString()}`))) : [el("li", { class: "muted" }, "Nothing exported yet.")]));
};

let status = {};
const loadStatus = async () => {
  status = await api("/api/status");
  $("status").replaceChildren(
    el("span", { class: "pill ok" }, "Renderer ready"),
    el("span", { class: "pill " + (status.piper.installed && status.piper.model ? "ok" : "off") }, status.piper.installed ? (status.piper.model ? `Piper: ${status.piper.model.replace(".onnx", "")}` : "Piper: no voice") : "Piper not installed"),
    el("span", { class: "pill " + (status.ollama.reachable ? "ok" : "off") }, status.ollama.reachable ? `Ollama: ${status.ollama.models.length} models` : "Ollama off (optional)"),
    ...(status.elevenlabs.enabled ? [el("span", { class: "pill" }, "ElevenLabs enabled (paid)")] : []));
  $("btnPiper").disabled = !(status.piper.installed && status.piper.model);
  if (!status.piper.installed) $("piperState").textContent = "Piper is not installed yet — run scripts\\setup-piper.ps1 once (see README).";
  $("btnOllama").disabled = !status.ollama.reachable;
  $("ollamaState").textContent = status.ollama.reachable ? "" : "Ollama is not running — this step is optional.";
  $("elRow").hidden = !status.elevenlabs.enabled;
  $("ollamaModels").replaceChildren(...status.ollama.models.map((m) => el("option", { value: m })));
};
const loadSettings = async () => {
  settings = await api("/api/settings");
  $("sOllamaUrl").value = settings.ollamaUrl; $("sOllamaModel").value = settings.ollamaModel; $("sPiperPath").value = settings.piperPath; $("sPiperModel").value = settings.piperModel; $("sPiperSpeed").value = settings.piperSpeed; $("sConc").value = settings.renderConcurrency;
  $("sElOn").checked = settings.elevenlabs.enabled; $("sElVoice").value = settings.elevenlabs.voiceId; $("sElKey").value = ""; $("sElHas").textContent = settings.elevenlabs.hasKey ? "(a key is stored)" : "(no key stored)";
};

// ---------- wiring ----------
const init = async () => {
  catalog = await api("/api/catalog");
  $("fFormat").append(...options(catalog.FORMATS)); $("fFps").append(...catalog.FPS_OPTIONS.map((f) => el("option", { value: f }, `${f} fps`)));
  bind("fTitle", () => project.title, (v) => (project.title = v));
  bind("fTopic", () => project.topic, (v) => (project.topic = v));
  bind("fFormat", () => project.format, (v) => { project.format = v; for (const k in thumbs) delete thumbs[k]; renderScenes(); }, "change");
  bind("fFps", () => project.fps, (v) => { project.fps = Number(v); refreshTimeline(); }, "change");
  bind("fSubs", () => project.subtitles, (v) => (project.subtitles = v), "change");
  bind("fScript", () => project.script, (v) => (project.script = v));
  bind("fVoVol", () => project.audio.narrationVolume, (v) => (project.audio.narrationVolume = v));
  bind("fMusic", () => project.audio.music, (v) => (project.audio.music = v), "change");
  bind("fSeed", () => project.audio.musicSeed, (v) => (project.audio.musicSeed = Math.round(v) || 0));
  bind("fMusicVol", () => project.audio.musicVolume, (v) => (project.audio.musicVolume = v));
  bind("fSfx", () => project.audio.sfx, (v) => (project.audio.sfx = v), "change");
  bind("fSfxVol", () => project.audio.sfxVolume, (v) => (project.audio.sfxVolume = v));
  $("tabs").addEventListener("click", (e) => { const t = e.target.dataset.tab; if (!t) return; document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("on", b === e.target)); document.querySelectorAll(".tab").forEach((s) => s.classList.toggle("on", s.id === "tab-" + t)); if (t === "export") loadOutputs(); });
  $("btnSave").onclick = () => save().then(() => say("Project saved.", true)).catch(() => {});
  $("btnNew").onclick = async () => {
    const title = prompt("Title of the new video:"); if (!title) return;
    let s = slugify(title); const have = (await api("/api/projects")).map((p) => p.slug); let n = 2; while (have.includes(s)) s = `${slugify(title)}-${n++}`;
    resetSmartProject(); window.resetVisualLab?.(); slug = s; project = blankProject(title); dirty = false; await save(); fill(); refreshTimeline();
  };
  $("fScriptFile").onchange = async (e) => { const f = e.target.files[0]; if (!f) return; project.script = await f.text(); $("fScript").value = project.script; markDirty(); say(`Imported ${f.name}.`, true); };
  // Replace the storyboard only after the complete candidate project has been
  // validated by the server. On any failure the current project is untouched.
  const adoptScenes = async (scenes, extra = {}) => {
    const candidate = { ...JSON.parse(JSON.stringify(project)), ...extra, scenes };
    await post(`/api/projects/${slug}/timeline`, { project: candidate }); // throws if the project is invalid
    project = candidate; resetSmartProject(); for (const k in thumbs) delete thumbs[k];
    markDirty(); fill(); document.querySelector('[data-tab="storyboard"]').click();
  };
  let stagedProduction = null;
  const clearProductionPreview = () => {
    stagedProduction = null;
    $("productionPreview").hidden = true;
    $("productionPreview").replaceChildren();
    $("productionFileName").textContent = "No production script selected";
    $("btnApplyProduction").disabled = true;
    $("btnCancelProduction").disabled = true;
    $("fProductionFile").value = "";
  };
  $("btnCancelProduction").onclick = clearProductionPreview;
  $("fProductionFile").onchange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    clearProductionPreview();
    $("productionFileName").textContent = file.name + " — validating…";
    try {
      if (file.size > 500_000) throw new Error("This file is too large (max 500 KB).");
      const useV1 = $("productionV1Topic").checked;
      const response = await post("/api/production/preview", { source: await file.text(), title: project.title, mode: useV1 ? "v1-topic-short" : undefined, seconds: Number($("productionV1Length").value) });
      stagedProduction = { ...response, v1Mode: useV1 };
      $("productionFileName").textContent = file.name;
      $("productionPreview").hidden = false;
      $("productionPreview").replaceChildren(
        el("b", {}, `${response.summary.sceneCount} validated scenes · ${response.summary.chapters} chapters`),
        el("p", { class: "muted" }, `First: ${response.scenes[0].production?.sceneTitle || "Scene 1"} — Last: ${response.scenes.at(-1).production?.sceneTitle || "Final scene"}`),
        el("p", { class: "muted" }, `Recommended format: ${response.suggestedFormat || "not specified"} · Current: ${project.format}`),
        ...response.warnings.map((w) => el("p", { class: "muted" }, "• " + w)),
        el("p", { class: "muted" }, "No project files or narration credits were changed. Review before applying.")
      );
      $("btnApplyProduction").disabled = false;
      $("btnCancelProduction").disabled = false;
    } catch (err) { clearProductionPreview(); say("Production script import failed. Current storyboard remains unchanged.\n" + (err.message || err)); }
  };
  $("btnApplyProduction").onclick = async () => {
    if (!stagedProduction) return;
    const staged = stagedProduction;
    if (!confirm(`Replace the current ${project.scenes.length}-scene storyboard with ${staged.scenes.length} imported scenes? Existing narration references will not be carried over. You must still click Save project afterward.`)) return;
    const extra = { script: staged.script };
    if ($("productionUseFormat").checked && staged.suggestedFormat) extra.format = staged.suggestedFormat;
    if (staged.v1Mode === true) { extra.format = "9:16"; extra.fps = 30; extra.subtitles = true; }
    try {
      await adoptScenes(staged.scenes, extra);
      clearProductionPreview();
      say(`Imported ${staged.scenes.length} validated scenes. Review the notes, then click Save project. No audio was generated.`, true);
    } catch (err) { say("Current storyboard was not changed.\n" + (err.message || err)); }
  };
  $("btnPlan").onclick = async () => {
    if (project.scenes.some((s) => s.narration) && !confirm("Replace the current storyboard with one built from the script?")) return;
    const btn = $("btnPlan"); btn.disabled = true;
    try {
      const useV1 = $("fV1Topic").checked;
      const r = await post("/api/plan", { title: project.title, script: project.script, mode: useV1 ? "v1-topic-short" : undefined, seconds: Number($("fV1Length").value) });
      await adoptScenes(r.scenes, useV1 ? { format: "9:16", fps: 30, subtitles: true } : {});
      say(useV1 ? `V1 illustrated Shorts: ${r.scenes.length} scenes. ${r.warnings.join(" ")}` : `Storyboard built: ${r.scenes.length} scenes, one per paragraph. Check each scene, then generate narration.`, true);
    } catch (e) { say(`The storyboard was not changed.\n${e.message}`); }
    finally { btn.disabled = false; }
  };
  $("btnOllama").onclick = async () => {
    try {
      $("ollamaState").textContent = "Working — local models can take a minute…";
      const { job } = await post("/api/ollama/storyboard", { topic: project.topic || project.title, script: project.script, sceneCount: Number($("fAiScenes").value) });
      const r = await runJob(job);
      await adoptScenes(r.scenes, project.script ? {} : { script: r.scenes.map((s) => s.narration).join("\n\n") });
      $("ollamaState").textContent = ""; say(`Ollama returned ${r.scenes.length} validated scenes. Review the facts before exporting.`, true);
    } catch (e) { $("ollamaState").textContent = ""; say(`The storyboard was not changed.\n${e.message}`); }
  };
  $("btnAddScene").onclick = () => { project.scenes.push({ id: newId(), template: "landscape", environment: "open-desert", narration: "", camera: "pan-right", ambience: "auto" }); touch(); renderScenes(); };
  $("btnCheckIntent").onclick = checkProductionIntent;
  $("btnAnalyzeSmart").onclick = analyzeSmartSelection;
  $("btnApplySmart").onclick = applySmartSelection;
  $("btnUndoSmart").onclick = undoSmartSelection;
  $("btnPiper").onclick = () => narrate("piper");
  $("btnEleven").onclick = () => narrate("elevenlabs");
  $("fMusicFile").onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { const r = await api(`/api/projects/${slug}/upload?kind=music&name=${encodeURIComponent(f.name)}`, { method: "POST", body: f }); project.audio.musicFile = r.file; project.audio.music = "file"; markDirty(); fill(); } catch (err) { fail(err); } };
  $("btnRender").onclick = () => exportVideo();
  $("btnSaveSettings").onclick = async () => {
    try {
      await api("/api/settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ ollamaUrl: $("sOllamaUrl").value.trim(), ollamaModel: $("sOllamaModel").value.trim(), piperPath: $("sPiperPath").value.trim(), piperModel: $("sPiperModel").value.trim(), piperSpeed: Number($("sPiperSpeed").value) || 1.12, renderConcurrency: Number($("sConc").value) || 0, elevenlabs: { enabled: $("sElOn").checked, voiceId: $("sElVoice").value.trim(), apiKey: $("sElKey").value } }) });
      await loadSettings(); await loadStatus(); say("Settings saved.", true);
    } catch (e) { fail(e); }
  };
  window.addEventListener("beforeunload", (e) => { if (dirty) e.preventDefault(); });
  await loadSettings(); await loadStatus();
  const list = await refreshProjects();
  if (list.length) await openProject((list.find((p) => p.slug.startsWith("demo")) || list[0]).slug);
  else { slug = "my-first-video"; project = blankProject("My first video"); await save(); fill(); }
};
init().catch(fail);
