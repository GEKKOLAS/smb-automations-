"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { cameraAt, frameAt, totalDuration, type DemoScript } from "@/lib/demo";
import type { Graph } from "@/lib/graph";
import type { Platform } from "@/lib/types";
import { FlowCanvas } from "./FlowCanvas";

declare global {
  interface Window {
    /** Lo usa scripts/render-videos.mjs para grabar el video fotograma a fotograma. */
    __demo?: { duration: number; seek: (ms: number) => void };
  }
}

export interface DemoPlayerProps {
  graph: Graph;
  script: DemoScript;
  title: string;
  platform: Platform;
  apps: string[];
  hoursSavedPerMonth?: number;
  /** "embed": dentro de la página del flujo. "page": a pantalla completa (/demo/<slug>). */
  variant?: "embed" | "page";
}

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const MAX_LINES = 6;
const MAX_CHARS = 110;

/** JSON en una línea, sin comillas en las claves: {gasto: 412.5, clics: 1830}. */
const compact = (v: unknown) =>
  JSON.stringify(v)
    .replace(/"([^"]+)":/g, "$1: ")
    .replace(/,(?=\S)/g, ", ");

/** Datos de ejemplo en formato compacto: una línea por campo, recortada para que quepa en el panel. */
function formatData(data: unknown): string {
  const clip = (line: string) => (line.length > MAX_CHARS ? `${line.slice(0, MAX_CHARS - 1)}…` : line);
  let lines: string[];
  if (typeof data === "string") lines = data.split("\n");
  else if (Array.isArray(data)) lines = data.map((v) => (typeof v === "string" ? v : compact(v)));
  else if (data && typeof data === "object")
    lines = Object.entries(data).map(([k, v]) => `${k}: ${typeof v === "string" ? v : compact(v)}`);
  else lines = [String(data)];
  if (lines.length > MAX_LINES) lines = [...lines.slice(0, MAX_LINES - 1), `… y ${lines.length - MAX_LINES + 1} más`];
  return lines.map(clip).join("\n");
}

export function DemoPlayer({ graph, script, title, platform, apps, hoursSavedPerMonth, variant = "embed" }: DemoPlayerProps) {
  const duration = useMemo(() => totalDuration(script), [script]);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const last = useRef<number | null>(null);

  // Modo grabación (?record): sin controles y con el tiempo controlado desde fuera.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("record")) {
      setRecording(true);
      window.__demo = { duration, seek: (ms) => flushSync(() => setT(ms)) };
    } else if (variant === "page") {
      setPlaying(true);
    }
  }, [duration, variant]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = (now: number) => {
      const dt = last.current === null ? 0 : now - last.current;
      last.current = now;
      setT((prev) => {
        const next = prev + dt;
        if (next >= duration) {
          setPlaying(false);
          return duration;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      last.current = null;
    };
  }, [playing, duration]);

  const toggle = useCallback(() => {
    if (t >= duration) setT(0);
    setPlaying((p) => !p);
  }, [t, duration]);

  const frame = frameAt(graph, script, t);
  const scene = frame.index >= 0 ? script.scenes[frame.index] : null;
  const total = script.scenes.length;
  const fadeIn = Math.min(1, frame.local * 9);
  const introOpacity = frame.phase === "intro" ? (frame.local > 0.82 ? (1 - frame.local) / 0.18 : 1) : 0;
  const outroOpacity = frame.phase === "outro" ? Math.min(1, frame.local * 4) : 0;
  const accent = platform === "n8n" ? "var(--accent)" : "var(--accent-2)";

  const frameCls =
    variant === "page"
      ? "h-screen w-screen"
      : "aspect-video w-full rounded-xl border border-border";

  return (
    <div className={variant === "page" ? "" : "space-y-3"}>
      <div
        className={`relative overflow-hidden bg-bg ${frameCls}`}
        style={{ containerType: "inline-size" }}
        onClick={recording ? undefined : toggle}
      >
        <div className="absolute inset-0 grid grid-rows-[auto_1fr_auto]" style={{ padding: "2.2cqw 2.8cqw", gap: "1.4cqw" }}>
          {/* Cabecera */}
          <div className="flex items-center" style={{ gap: "1cqw" }}>
            <span className="rounded-full font-semibold text-white" style={{ background: accent, fontSize: "1.1cqw", padding: "0.3cqw 0.9cqw" }}>
              {platform === "n8n" ? "n8n" : "Zapier"}
            </span>
            <span className="truncate font-semibold" style={{ fontSize: "1.6cqw" }}>{title}</span>
            <span className="ml-auto shrink-0 text-muted tabular-nums" style={{ fontSize: "1.2cqw" }}>
              {scene ? `Paso ${frame.index + 1} de ${total}` : ""}
            </span>
          </div>

          {/* Diagrama */}
          <div className="min-h-0 rounded-[1.2cqw] border border-border bg-surface-2" style={{ padding: "1.4cqw" }}>
            <FlowCanvas graph={graph} frame={frame} viewBox={cameraAt(graph, script, t)} label={`Simulación del flujo ${title}`} fit />
          </div>

          {/* Explicación del paso + datos */}
          <div className="grid grid-cols-[1fr_38%]" style={{ gap: "1.4cqw", height: "11.5cqw" }}>
            <div className="flex flex-col justify-center rounded-[1.2cqw] border border-border bg-surface" style={{ padding: "1.2cqw 1.6cqw", opacity: scene ? fadeIn : 0 }}>
              <span className="font-medium uppercase tracking-wider" style={{ color: "var(--flow)", fontSize: "0.95cqw", marginBottom: "0.4cqw" }}>
                {scene ? `Paso ${frame.index + 1}` : ""}
              </span>
              <p className="leading-snug" style={{ fontSize: "1.75cqw" }}>{scene?.caption}</p>
            </div>
            <div className="overflow-hidden rounded-[1.2cqw] border border-border bg-surface" style={{ padding: "1cqw 1.3cqw", opacity: scene ? fadeIn : 0 }}>
              <span className="block text-muted" style={{ fontSize: "0.95cqw", marginBottom: "0.4cqw" }}>Datos en este paso</span>
              <pre className="whitespace-pre-wrap break-words font-mono leading-relaxed" style={{ fontSize: "1.05cqw" }}>{scene?.data !== undefined ? formatData(scene.data) : "—"}</pre>
            </div>
          </div>
        </div>

        {/* Portada */}
        {introOpacity > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/95 text-center" style={{ opacity: introOpacity, padding: "6cqw" }}>
            <span className="rounded-full font-semibold text-white" style={{ background: accent, fontSize: "1.3cqw", padding: "0.4cqw 1.2cqw", marginBottom: "2cqw" }}>
              Automatización con {platform === "n8n" ? "n8n" : "Zapier"}
            </span>
            <h2 className="font-semibold tracking-tight" style={{ fontSize: "4cqw", lineHeight: 1.1 }}>{title}</h2>
            {script.intro && <p className="text-muted" style={{ fontSize: "1.8cqw", marginTop: "1.6cqw", maxWidth: "70cqw" }}>{script.intro}</p>}
            <div className="flex flex-wrap justify-center" style={{ gap: "0.7cqw", marginTop: "2.4cqw" }}>
              {apps.map((a) => (
                <span key={a} className="rounded-md border border-border bg-surface" style={{ fontSize: "1.2cqw", padding: "0.3cqw 0.9cqw" }}>{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Cierre */}
        {outroOpacity > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/90 text-center" style={{ opacity: outroOpacity }}>
            <span className="grid place-items-center rounded-full text-white" style={{ background: "var(--trigger)", width: "6cqw", height: "6cqw", fontSize: "3cqw" }}>✓</span>
            <h2 className="font-semibold" style={{ fontSize: "3.2cqw", marginTop: "1.6cqw" }}>Flujo completado</h2>
            <p className="text-muted" style={{ fontSize: "1.7cqw", marginTop: "0.8cqw" }}>
              {total} pasos automáticos{hoursSavedPerMonth ? ` · ~${hoursSavedPerMonth} horas ahorradas al mes` : ""}
            </p>
          </div>
        )}

        {/* Barra de progreso */}
        <div className="absolute inset-x-0 bottom-0 bg-border" style={{ height: "0.35cqw" }}>
          <div className="h-full" style={{ width: `${(t / duration) * 100}%`, background: "var(--flow)" }} />
        </div>

        {!recording && !playing && (
          <button
            aria-label={t >= duration ? "Repetir" : "Reproducir"}
            className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-text text-bg shadow-lg transition hover:scale-105"
            style={{ width: "7cqw", height: "7cqw", fontSize: "2.6cqw", marginTop: introOpacity > 0 ? "14cqw" : 0 }}
          >
            {t >= duration ? "↺" : "▶"}
          </button>
        )}
      </div>

      {variant === "embed" && !recording && (
        <div className="flex items-center gap-3 text-sm">
          <button onClick={toggle} className="rounded-lg border border-border px-3 py-1.5 hover:border-text">
            {playing ? "Pausa" : t >= duration ? "Repetir" : "Reproducir"}
          </button>
          <input
            type="range"
            min={0}
            max={duration}
            value={t}
            onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }}
            className="flex-1 accent-[var(--flow)]"
            aria-label="Posición de la simulación"
          />
          <span className="tabular-nums text-muted">{fmt(t)} / {fmt(duration)}</span>
        </div>
      )}
    </div>
  );
}
