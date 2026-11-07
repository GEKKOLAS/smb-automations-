import { buildGraph, NODE_H, NODE_W, type GraphNode } from "@/lib/n8n-graph";
import type { N8nWorkflow } from "@/lib/types";

const COLOR: Record<GraphNode["kind"], string> = {
  trigger: "var(--trigger)",
  ai: "var(--ai)",
  logic: "var(--logic)",
  action: "var(--action)",
};

const LEGEND: [GraphNode["kind"], string][] = [
  ["trigger", "Disparador"],
  ["action", "Acción / app"],
  ["logic", "Lógica"],
  ["ai", "IA"],
];

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/** Diagrama SVG del flujo n8n, dibujado con las posiciones reales del editor. */
export function N8nDiagram({ workflow }: { workflow: N8nWorkflow }) {
  const { nodes, edges, width, height } = buildGraph(workflow);
  const byName = new Map(nodes.map((n) => [n.name, n]));

  return (
    <figure>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="max-w-none"
          role="img"
          aria-label={`Diagrama del flujo ${workflow.name ?? ""}`}
        >
          <defs>
            <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="var(--border)" />
            </pattern>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
            </marker>
          </defs>
          <rect width={width} height={height} fill="url(#dots)" />

          {edges.map((e, i) => {
            const a = byName.get(e.from)!;
            const b = byName.get(e.to)!;
            const x1 = a.x + NODE_W;
            const y1 = a.y + NODE_H / 2;
            const x2 = b.x;
            const y2 = b.y + NODE_H / 2;
            const dx = Math.max(40, (x2 - x1) / 2);
            // Las salidas de un nodo IF/Switch se etiquetan (0 = verdadero, 1 = falso).
            const isBranch = /\.(if|switch)$/.test(a.type);
            const label = isBranch ? (a.type.endsWith(".if") ? (e.output === 0 ? "sí" : "no") : `#${e.output + 1}`) : null;
            return (
              <g key={i}>
                <path
                  d={`M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`}
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth={1.5}
                  markerEnd="url(#arrow)"
                />
                {label && (
                  <text x={x1 + 10} y={y1 + (y2 > y1 ? 16 : -8)} fontSize={11} fill="var(--muted)">
                    {label}
                  </text>
                )}
              </g>
            );
          })}

          {nodes.map((n) => (
            <g key={n.name} transform={`translate(${n.x},${n.y})`}>
              <title>{`${n.name} — ${n.type}`}</title>
              <rect width={NODE_W} height={NODE_H} rx={10} fill="var(--surface)" stroke="var(--border)" />
              <rect width={5} height={NODE_H} rx={2.5} fill={COLOR[n.kind]} />
              <text x={16} y={27} fontSize={13} fontWeight={600} fill="var(--text)">
                {truncate(n.name, 22)}
              </text>
              <text x={16} y={46} fontSize={11} fill="var(--muted)">
                {truncate(n.label, 26)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        {LEGEND.map(([k, label]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLOR[k] }} />
            {label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
