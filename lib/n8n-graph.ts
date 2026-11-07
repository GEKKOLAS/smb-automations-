import type { N8nWorkflow } from "./types";

export interface GraphNode {
  name: string;
  type: string;
  label: string;
  x: number;
  y: number;
  kind: "trigger" | "ai" | "logic" | "action";
}

export interface GraphEdge {
  from: string;
  to: string;
  output: number;
  connectionType: string;
}

export const NODE_W = 180;
export const NODE_H = 64;
const PAD = 40;

const TRIGGER_RE = /trigger|webhook|cron|schedule|formTrigger/i;
const AI_RE = /openAi|langchain|anthropic|agent|lmChat/i;
const LOGIC_RE = /\.(if|switch|merge|filter|code|set|splitInBatches|wait|noOp|function)$/i;

function kindOf(type: string): GraphNode["kind"] {
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

/** Convierte la exportación de n8n en nodos y aristas usando las posiciones del editor. */
export function buildGraph(wf: N8nWorkflow) {
  const nodes = wf.nodes.filter((n) => n.type !== "n8n-nodes-base.stickyNote");
  const minX = Math.min(...nodes.map((n) => n.position[0]));
  const minY = Math.min(...nodes.map((n) => n.position[1]));

  const graphNodes: GraphNode[] = nodes.map((n) => ({
    name: n.name,
    type: n.type,
    label: prettyType(n.type),
    x: n.position[0] - minX + PAD,
    y: n.position[1] - minY + PAD,
    kind: kindOf(n.type),
  }));

  const known = new Set(graphNodes.map((n) => n.name));
  const edges: GraphEdge[] = [];
  for (const [from, byType] of Object.entries(wf.connections)) {
    for (const [connectionType, outputs] of Object.entries(byType)) {
      outputs.forEach((targets, output) => {
        for (const t of targets ?? []) {
          if (known.has(from) && known.has(t.node)) {
            edges.push({ from, to: t.node, output, connectionType });
          }
        }
      });
    }
  }

  const width = Math.max(...graphNodes.map((n) => n.x)) + NODE_W + PAD;
  const height = Math.max(...graphNodes.map((n) => n.y)) + NODE_H + PAD;
  return { nodes: graphNodes, edges, width, height };
}
