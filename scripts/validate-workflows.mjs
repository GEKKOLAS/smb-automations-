// Valida que cada carpeta de workflows/ tenga meta.json + archivo de flujo correctos.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "workflows");
const FILES = { n8n: "workflow.n8n.json", zapier: "zap.json" };
const STATUS = ["produccion", "piloto", "plantilla"];
const REQUIRED = ["title", "platform", "category", "summary", "description", "apps", "tags", "trigger", "status", "updated"];
const STEP_TYPES = ["trigger", "action", "filter", "path", "delay", "formatter"];

const errors = [];
const err = (slug, msg) => errors.push(`  ✗ ${slug}: ${msg}`);
const readJson = (slug, file) => {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (e) { err(slug, `${path.basename(file)} no es JSON válido (${e.message})`); return null; }
};

const slugs = fs.readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

for (const slug of slugs) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) err(slug, "el nombre de carpeta debe ser kebab-case");
  const dir = path.join(ROOT, slug);
  if (!fs.existsSync(path.join(dir, "meta.json"))) { err(slug, "falta meta.json"); continue; }
  const meta = readJson(slug, path.join(dir, "meta.json"));
  if (!meta) continue;

  for (const k of REQUIRED) if (meta[k] === undefined || meta[k] === "") err(slug, `meta.json: falta «${k}»`);
  if (!FILES[meta.platform]) { err(slug, `platform debe ser "n8n" o "zapier"`); continue; }
  if (!STATUS.includes(meta.status)) err(slug, `status debe ser uno de ${STATUS.join(", ")}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.updated ?? "")) err(slug, "updated debe tener formato AAAA-MM-DD");
  for (const k of ["apps", "tags"]) if (!Array.isArray(meta[k])) err(slug, `${k} debe ser una lista`);

  const file = path.join(dir, FILES[meta.platform]);
  if (!fs.existsSync(file)) { err(slug, `falta ${FILES[meta.platform]}`); continue; }
  const wf = readJson(slug, file);
  if (!wf) continue;

  if (meta.platform === "n8n") {
    if (!Array.isArray(wf.nodes) || !wf.nodes.length) { err(slug, "el flujo n8n no tiene nodos"); continue; }
    const names = new Set(wf.nodes.map((n) => n.name));
    for (const n of wf.nodes) {
      if (!Array.isArray(n.position) || n.position.length !== 2) err(slug, `el nodo «${n.name}» no tiene position [x, y]`);
    }
    for (const [from, byType] of Object.entries(wf.connections ?? {})) {
      if (!names.has(from)) err(slug, `conexión desde nodo inexistente «${from}»`);
      for (const outputs of Object.values(byType))
        for (const targets of outputs)
          for (const t of targets ?? [])
            if (!names.has(t.node)) err(slug, `conexión hacia nodo inexistente «${t.node}»`);
    }
  } else {
    const walk = (steps, where) => {
      if (!Array.isArray(steps) || !steps.length) return err(slug, `${where}: sin pasos`);
      steps.forEach((s, i) => {
        if (!STEP_TYPES.includes(s.type)) err(slug, `${where} paso ${i + 1}: tipo «${s.type}» no válido`);
        if (!s.app || !s.event) err(slug, `${where} paso ${i + 1}: faltan app/event`);
        if (s.type === "path") (s.branches ?? []).forEach((b) => walk(b.steps, `rama «${b.name}»`));
      });
    };
    walk(wf.steps, "zap");
    if (wf.steps?.[0]?.type !== "trigger") err(slug, "el primer paso del Zap debe ser un trigger");
  }
}

if (errors.length) {
  console.error(`Errores en la biblioteca de flujos:\n${errors.join("\n")}`);
  process.exit(1);
}
console.log(`✓ ${slugs.length} flujos válidos`);
