import { n8nToGraph } from "@/lib/graph";
import type { N8nWorkflow } from "@/lib/types";
import { FlowCanvas, KindLegend } from "./FlowCanvas";

/** Diagrama estático del flujo n8n, con las posiciones reales del editor. */
export function N8nDiagram({ workflow }: { workflow: N8nWorkflow }) {
  return (
    <figure>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-2">
        <FlowCanvas graph={n8nToGraph(workflow)} label={`Diagrama del flujo ${workflow.name ?? ""}`} />
      </div>
      <figcaption className="mt-3"><KindLegend /></figcaption>
    </figure>
  );
}
