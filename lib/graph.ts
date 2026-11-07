import type { N8nWorkflow, Workflow, ZapierStep, ZapierWorkflow } from "./types";

export type NodeKind = "trigger" | "ai" | "logic" | "action";

/** Nodo genérico del diagrama, común a n8n y Zapier. */
export interface GraphNode {
  /** n8n: nombre del nodo. Zapier: ruta del paso, p. ej. "3" o "7.2.1" (paso 7, rama 2, paso 1). */
  id: string;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  kind: NodeKind;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
}

export const NODE_W = 180;
export const NODE_H = 64;
const PAD = 40;

const TRIGGER_RE = /trigger|webhook|cron|schedule|formTrigger/i;
const AI_RE = /openAi|langchain|anthropic|agent|lmChat/i;
const LOGIC_RE = /\.(if|switch|merge|filter|code|set|splitInBatches|wait|noOp|function)$/i;

function n8nKind(type: string): NodeKind {
  if (TRIGGER_RE.test(type)) return "trigger";
  if (AI_RE.test(type)) return "ai";
  if (LOGIC_RE.test(type)) return "logic";
  return "action";
}

/** Nombre legible del tipo: "n8n-nodes-base.googleSheets" -> "Google Sheets". */
export function prettyType(type: string): string {
  const base = type.split(".").pop() ?? type;
  return base
    .replace(/Trigger$/, " Trigger")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function finish(nodes: GraphNode[], edges: GraphEdge[]): Graph {
  const minX = Math.min(...nodes.map((n) => n.x));
  const minY = Math.min(...nodes.map((n) => n.y));
  for (const n of nodes) {
    n.x = n.x - minX + PAD;
    n.y = n.y - minY + PAD;
  }
  return {
    nodes,
    edges,
    width: Math.max(...nodes.map((n) => n.x)) + NODE_W + PAD,
    height: Math.max(...nodes.map((n) => n.y)) + NODE_H + PAD,
  };
}

/** Exportación de n8n -> grafo, usando las posiciones del editor. */
export function n8nToGraph(wf: N8nWorkflow): Graph {
  const raw = wf.nodes.filter((n) => n.type !== "n8n-nodes-base.stickyNote");
  const typeOf = new Map(raw.map((n) => [n.name, n.type]));
  const nodes: GraphNode[] = raw.map((n) => ({
    id: n.name,
    title: n.name,
    subtitle: prettyType(n.type),
    x: n.position[0],
    y: n.position[1],
    kind: n8nKind(n.type),
  }));

  const edges: GraphEdge[] = [];
  for (const [from, byType] of Object.entries(wf.connections)) {
    const type = typeOf.get(from);
    if (!type) continue;
    for (const outputs of Object.values(byType)) {
      outputs.forEach((targets, output) => {
        for (const t of targets ?? []) {
          if (!typeOf.has(t.node)) continue;
          // Las salidas de IF/Switch se etiquetan para distinguir las ramas.
          const label = type.endsWith(".if") ? (output === 0 ? "sí" : "no") : type.endsWith(".switch") ? `#${output + 1}` : undefined;
          edges.push({ from, to: t.node, label });
        }
      });
    }
  }
  return finish(nodes, edges);
}

const ZAP_KIND: Record<ZapierStep["type"], NodeKind> = {
  trigger: "trigger",
  action: "action",
  filter: "logic",
  path: "logic",
  delay: "logic",
  formatter: "logic",
};

const COL = 240;
const BRANCH_GAP = 110;
const ROW = 130;

/** Zap -> grafo horizontal; cada rama de un Path ocupa su propia fila. */
export function zapierToGraph(wf: ZapierWorkflow): Graph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const walk = (steps: ZapierStep[], prefix: string, x0: number, y: number, prev: string | null, firstLabel?: string) => {
    steps.forEach((s, i) => {
      const id = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;
      const x = x0 + i * COL;
      nodes.push({ id, title: s.app, subtitle: s.event, x, y, kind: ZAP_KIND[s.type] });
      if (prev) edges.push({ from: prev, to: id, label: i === 0 ? firstLabel : undefined });
      prev = id;
      if (s.type === "path" && s.branches) {
        const n = s.branches.length;
        s.branches.forEach((b, bi) => {
          // Hueco extra antes de las ramas para que quepa la etiqueta de cada una.
          walk(b.steps, `${id}.${bi + 1}`, x + COL + BRANCH_GAP, y + (bi - (n - 1) / 2) * ROW, id, b.name);
        });
      }
    });
  };
  walk(wf.steps, "", 0, 0, null);
  return finish(nodes, edges);
}

export function workflowGraph(w: Pick<Workflow, "meta" | "definition">): Graph {
  return w.meta.platform === "n8n"
    ? n8nToGraph(w.definition as N8nWorkflow)
    : zapierToGraph(w.definition as ZapierWorkflow);
}

/** Punto de la curva de una arista en t ∈ [0, 1] (bezier cúbica horizontal). */
export function edgeGeometry(a: GraphNode, b: GraphNode) {
  const x1 = a.x + NODE_W;
  const y1 = a.y + NODE_H / 2;
  const x2 = b.x;
  const y2 = b.y + NODE_H / 2;
  const dx = Math.max(40, (x2 - x1) / 2);
  const c1 = [x1 + dx, y1];
  const c2 = [x2 - dx, y2];
  const d = `M${x1},${y1} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${x2},${y2}`;
  const at = (t: number) => {
    const u = 1 - t;
    return {
      x: u * u * u * x1 + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * x2,
      y: u * u * u * y1 + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * y2,
    };
  };
  return { d, at, mid: at(0.5) };
}
