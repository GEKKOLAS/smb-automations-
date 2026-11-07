import type { Graph } from "./graph";

/** Un paso del guion de la demo: `workflows/<slug>/demo.json`. */
export interface DemoScene {
  /** Id del nodo (o nodos, si se ejecutan a la vez) que se activa en este paso. */
  node: string | string[];
  caption: string;
  /** Datos de ejemplo que lleva el flujo en este punto. */
  data?: unknown;
}

export interface DemoScript {
  /** Frase de introducción opcional (se muestra en la portada del video). */
  intro?: string;
  scenes: DemoScene[];
}

export const INTRO_MS = 2200;
export const SCENE_MS = 2800;
export const TRAVEL_MS = 850;
export const OUTRO_MS = 3000;

export const nodesOf = (s: DemoScene) => (Array.isArray(s.node) ? s.node : [s.node]);

/** Guion por defecto si el flujo no tiene demo.json: recorre el grafo en anchura. */
export function autoScript(graph: Graph): DemoScript {
  const incoming = new Set(graph.edges.map((e) => e.to));
  let frontier = graph.nodes.filter((n) => !incoming.has(n.id)).map((n) => n.id);
  const seen = new Set<string>();
  const scenes: DemoScene[] = [];
  while (frontier.length) {
    const level = frontier.filter((id) => !seen.has(id));
    level.forEach((id) => seen.add(id));
    if (level.length) {
      const titles = level.map((id) => graph.nodes.find((n) => n.id === id)!);
      scenes.push({ node: level, caption: titles.map((n) => `${n.title}: ${n.subtitle}`).join(" · ") });
    }
    frontier = graph.edges.filter((e) => level.includes(e.from)).map((e) => e.to);
  }
  return { scenes };
}

export function totalDuration(script: DemoScript) {
  return INTRO_MS + script.scenes.length * SCENE_MS + OUTRO_MS;
}

export type Phase = "intro" | "run" | "outro";

export interface DemoFrame {
  phase: Phase;
  /** Índice del paso actual (-1 en la intro). */
  index: number;
  done: Set<string>;
  active: Set<string>;
  /** Progreso (0–1) de las aristas que están transportando datos ahora mismo, por "from→to". */
  traveling: Map<string, number>;
  /** Aristas ya recorridas. */
  passed: Set<string>;
  /** 0–1 dentro del paso actual, para animaciones suaves. */
  local: number;
}

export const edgeKey = (from: string, to: string) => `${from}→${to}`;

/** Estado del diagrama en el instante t (ms). Es una función pura: el video se genera fotograma a fotograma. */
export function frameAt(graph: Graph, script: DemoScript, t: number): DemoFrame {
  const n = script.scenes.length;
  const done = new Set<string>();
  const active = new Set<string>();
  const traveling = new Map<string, number>();
  const passed = new Set<string>();

  const markPassed = (targets: string[], reached: Set<string>) => {
    for (const e of graph.edges) if (targets.includes(e.to) && reached.has(e.from)) passed.add(edgeKey(e.from, e.to));
  };

  if (t < INTRO_MS) return { phase: "intro", index: -1, done, active, traveling, passed, local: t / INTRO_MS };

  const runT = t - INTRO_MS;
  const index = Math.min(n - 1, Math.floor(runT / SCENE_MS));
  const isOutro = runT >= n * SCENE_MS;

  for (let i = 0; i < (isOutro ? n : index); i++) {
    const ids = nodesOf(script.scenes[i]);
    markPassed(ids, done);
    ids.forEach((id) => done.add(id));
  }
  if (isOutro) {
    return { phase: "outro", index: n - 1, done, active, traveling, passed, local: Math.min(1, (runT - n * SCENE_MS) / OUTRO_MS) };
  }

  const local = runT - index * SCENE_MS;
  const ids = nodesOf(script.scenes[index]);
  const incoming = graph.edges.filter((e) => ids.includes(e.to) && done.has(e.from));
  if (local < TRAVEL_MS && incoming.length) {
    const p = local / TRAVEL_MS;
    const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    incoming.forEach((e) => traveling.set(edgeKey(e.from, e.to), eased));
  } else {
    incoming.forEach((e) => passed.add(edgeKey(e.from, e.to)));
    ids.forEach((id) => active.add(id));
  }
  return { phase: "run", index, done, active, traveling, passed, local: local / SCENE_MS };
}

/** Ancho máximo (en unidades del grafo) que enseña la cámara durante la simulación. */
export const CAMERA_W = 1150;

const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

/**
 * viewBox de la "cámara": en flujos anchos sigue a los nodos activos con un
 * desplazamiento suave; en la portada y el cierre muestra el flujo completo.
 */
export function cameraAt(graph: Graph, script: DemoScript, t: number): string {
  const full = `0 0 ${graph.width} ${graph.height}`;
  if (graph.width <= CAMERA_W * 1.08) return full;

  const center = (i: number) => {
    const ids = nodesOf(script.scenes[Math.max(0, i)]);
    const xs = graph.nodes.filter((n) => ids.includes(n.id)).map((n) => n.x + 90);
    return xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  };
  const clamp = (cx: number, w: number) => Math.min(Math.max(cx - w / 2, 0), graph.width - w);

  const n = script.scenes.length;
  const runT = t - INTRO_MS;
  if (runT < 0) return `${clamp(center(0), CAMERA_W)} 0 ${CAMERA_W} ${graph.height}`;

  if (runT >= n * SCENE_MS) {
    // Cierre: aleja la cámara hasta ver el flujo entero.
    const p = ease(Math.min(1, (runT - n * SCENE_MS) / (OUTRO_MS * 0.3)));
    const w = CAMERA_W + (graph.width - CAMERA_W) * p;
    return `${clamp(center(n - 1), w) * (1 - p)} 0 ${w} ${graph.height}`;
  }

  const i = Math.floor(runT / SCENE_MS);
  const local = runT - i * SCENE_MS;
  const p = ease(Math.min(1, local / TRAVEL_MS));
  const cx = center(i - 1) + (center(i) - center(i - 1)) * p;
  return `${clamp(cx, CAMERA_W)} 0 ${CAMERA_W} ${graph.height}`;
}
