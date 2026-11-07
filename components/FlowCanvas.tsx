import { edgeGeometry, NODE_H, NODE_W, type Graph, type NodeKind } from "@/lib/graph";
import { edgeKey, type DemoFrame } from "@/lib/demo";

export const KIND_COLOR: Record<NodeKind, string> = {
  trigger: "var(--trigger)",
  ai: "var(--ai)",
  logic: "var(--logic)",
  action: "var(--action)",
};

export const KIND_LABEL: Record<NodeKind, string> = {
  trigger: "Disparador",
  action: "Acción / app",
  logic: "Lógica",
  ai: "IA",
};

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * Dibuja el grafo en SVG. Sin `frame` es un diagrama estático; con `frame`
 * resalta los nodos activos y anima los datos viajando por las aristas.
 */
export function FlowCanvas({
  graph,
  frame,
  label,
  fit = false,
  viewBox,
}: {
  graph: Graph;
  frame?: DemoFrame;
  label: string;
  /** true: ocupa el contenedor manteniendo proporciones (para el reproductor). */
  fit?: boolean;
  /** viewBox alternativo (la "cámara" del reproductor). */
  viewBox?: string;
}) {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const live = Boolean(frame);
  const style = fit
    ? { width: "100%", height: "100%" }
    : { width: "100%", height: "auto", minWidth: Math.min(graph.width, 900) };

  return (
    <svg viewBox={viewBox ?? `0 0 ${graph.width} ${graph.height}`} style={style} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}>
      <defs>
        <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="var(--border)" />
        </pattern>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
        </marker>
        <marker id="arrow-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--flow)" />
        </marker>
        <filter id="glow" x="-30%" y="-60%" width="160%" height="220%">
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="var(--flow)" floodOpacity="0.55" />
        </filter>
      </defs>
      {!fit && <rect width={graph.width} height={graph.height} fill="url(#dots)" />}

      {graph.edges.map((e) => {
        const a = byId.get(e.from)!;
        const b = byId.get(e.to)!;
        const g = edgeGeometry(a, b);
        const key = edgeKey(e.from, e.to);
        const passed = frame?.passed.has(key);
        const p = frame?.traveling.get(key);
        const dim = live && !passed && p === undefined;
        return (
          <g key={key} opacity={dim ? 0.45 : 1}>
            <path d={g.d} fill="none" stroke="var(--muted)" strokeWidth={1.5} markerEnd={passed ? undefined : "url(#arrow)"} />
            {passed && <path d={g.d} fill="none" stroke="var(--flow)" strokeWidth={2.5} markerEnd="url(#arrow-on)" />}
            {p !== undefined && (
              <>
                <path d={g.d} fill="none" stroke="var(--flow)" strokeWidth={2.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
                <circle cx={g.at(p).x} cy={g.at(p).y} r={7} fill="var(--flow)" filter="url(#glow)" />
              </>
            )}
            {e.label && (
              <g transform={`translate(${g.mid.x},${g.mid.y})`}>
                <rect x={-Math.max(16, e.label.length * 3.6 + 8)} y={-10} width={Math.max(32, e.label.length * 7.2 + 16)} height={20} rx={10} fill="var(--surface)" stroke="var(--border)" />
                <text textAnchor="middle" dominantBaseline="central" fontSize={11} fill="var(--muted)">{e.label}</text>
              </g>
            )}
          </g>
        );
      })}

      {graph.nodes.map((n) => {
        const active = frame?.active.has(n.id);
        const done = frame?.done.has(n.id);
        const dim = live && !active && !done;
        return (
          <g key={n.id} transform={`translate(${n.x},${n.y})`} opacity={dim ? 0.5 : 1}>
            <title>{`${n.title} — ${n.subtitle}`}</title>
            <rect
              width={NODE_W}
              height={NODE_H}
              rx={10}
              fill="var(--surface)"
              stroke={active ? "var(--flow)" : done ? "color-mix(in srgb, var(--flow) 45%, var(--border))" : "var(--border)"}
              strokeWidth={active ? 2.5 : 1}
              filter={active ? "url(#glow)" : undefined}
            />
            <rect width={5} height={NODE_H} rx={2.5} fill={KIND_COLOR[n.kind]} />
            <text x={16} y={27} fontSize={13} fontWeight={600} fill="var(--text)">{truncate(n.title, 21)}</text>
            <text x={16} y={46} fontSize={11} fill="var(--muted)">{truncate(n.subtitle, 25)}</text>
            {(done || active) && (
              <g transform={`translate(${NODE_W - 10},10)`}>
                <circle r={9} fill={active ? "var(--flow)" : "var(--trigger)"} />
                {active ? (
                  <circle r={3.5} fill="var(--surface)" />
                ) : (
                  <path d="M-4,0 L-1,3 L4,-3" fill="none" stroke="var(--surface)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                )}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function KindLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted">
      {(Object.keys(KIND_LABEL) as NodeKind[]).map((k) => (
        <span key={k} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: KIND_COLOR[k] }} />
          {KIND_LABEL[k]}
        </span>
      ))}
    </div>
  );
}
