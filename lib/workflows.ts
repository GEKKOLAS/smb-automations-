import fs from "node:fs";
import path from "node:path";
import { autoScript, type DemoScript } from "./demo";
import { workflowGraph } from "./graph";
import type { N8nWorkflow, Workflow, WorkflowMeta, ZapierWorkflow } from "./types";

const ROOT = path.join(process.cwd(), "workflows");

export const FILE_BY_PLATFORM = { n8n: "workflow.n8n.json", zapier: "zap.json" } as const;

let cache: Workflow[] | null = null;

export function getWorkflows(): Workflow[] {
  if (cache) return cache;
  const slugs = fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  cache = slugs
    .map((slug) => {
      const dir = path.join(ROOT, slug);
      const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8")) as WorkflowMeta;
      const fileName = FILE_BY_PLATFORM[meta.platform];
      const raw = fs.readFileSync(path.join(dir, fileName), "utf8");
      const definition = JSON.parse(raw) as N8nWorkflow | ZapierWorkflow;
      const demoFile = path.join(dir, "demo.json");
      const demo = fs.existsSync(demoFile)
        ? (JSON.parse(fs.readFileSync(demoFile, "utf8")) as DemoScript)
        : autoScript(workflowGraph({ meta, definition }));
      const video = fs.existsSync(path.join(process.cwd(), "public", "videos", `${slug}.mp4`))
        ? `/videos/${slug}.mp4`
        : undefined;
      return { slug, meta, raw, definition, fileName, demo, video };
    })
    .sort((a, b) => b.meta.updated.localeCompare(a.meta.updated));
  return cache;
}

export function getWorkflow(slug: string): Workflow | undefined {
  return getWorkflows().find((w) => w.slug === slug);
}

export function countSteps(w: Workflow): number {
  if (w.meta.platform === "n8n") {
    return (w.definition as N8nWorkflow).nodes.filter((n) => n.type !== "n8n-nodes-base.stickyNote").length;
  }
  const walk = (steps: ZapierWorkflow["steps"]): number =>
    steps.reduce((acc, s) => acc + 1 + (s.branches ?? []).reduce((b, br) => b + walk(br.steps), 0), 0);
  return walk((w.definition as ZapierWorkflow).steps);
}
