export type Platform = "n8n" | "zapier";

export type Status = "produccion" | "piloto" | "plantilla";

/** Metadatos de cada flujo: `workflows/<slug>/meta.json`. */
export interface WorkflowMeta {
  title: string;
  platform: Platform;
  category: string;
  summary: string;
  description: string;
  apps: string[];
  tags: string[];
  trigger: string;
  status: Status;
  industry?: string;
  /** Tiempo aproximado ahorrado al mes, en horas. */
  hoursSavedPerMonth?: number;
  setup?: string[];
  credentials?: string[];
  updated: string;
}

/** Exportación nativa de n8n (solo los campos que usamos). */
export interface N8nWorkflow {
  name?: string;
  nodes: {
    id?: string;
    name: string;
    type: string;
    position: [number, number];
    parameters?: Record<string, unknown>;
    notes?: string;
  }[];
  connections: Record<
    string,
    Record<string, { node: string; type: string; index: number }[][]>
  >;
}

/**
 * Zapier no tiene un formato de exportación público estable, así que
 * documentamos cada Zap con este esquema sencillo.
 */
export interface ZapierStep {
  type: "trigger" | "action" | "filter" | "path" | "delay" | "formatter";
  app: string;
  event: string;
  description?: string;
  /** Solo para `path`: ramas con sus propios pasos. */
  branches?: { name: string; condition: string; steps: ZapierStep[] }[];
}

export interface ZapierWorkflow {
  name: string;
  steps: ZapierStep[];
}

export interface Workflow {
  slug: string;
  meta: WorkflowMeta;
  /** Contenido crudo del archivo de flujo, tal cual se descarga. */
  raw: string;
  definition: N8nWorkflow | ZapierWorkflow;
  fileName: string;
  /** Guion de la simulación (demo.json o generado a partir del grafo). */
  demo: import("./demo").DemoScript;
  /** Ruta pública del video generado, si existe (public/videos/<slug>.mp4). */
  video?: string;
}
