import type { ZapierStep } from "@/lib/types";

const TYPE_LABEL: Record<ZapierStep["type"], string> = {
  trigger: "Disparador",
  action: "Acción",
  filter: "Filtro",
  path: "Rutas",
  delay: "Espera",
  formatter: "Formato",
};

const TYPE_COLOR: Record<ZapierStep["type"], string> = {
  trigger: "var(--trigger)",
  action: "var(--action)",
  filter: "var(--logic)",
  path: "var(--logic)",
  delay: "var(--muted)",
  formatter: "var(--ai)",
};

function StepList({ steps, start = 1 }: { steps: ZapierStep[]; start?: number }) {
  return (
    <ol className="relative space-y-3">
      {steps.map((s, i) => (
        <li key={i} className="relative pl-12">
          {i < steps.length - 1 && <span className="absolute left-[15px] top-9 h-[calc(100%-12px)] w-px bg-border" />}
          <span
            className="absolute left-0 top-2 grid h-8 w-8 place-items-center rounded-full text-xs font-semibold text-white"
            style={{ background: TYPE_COLOR[s.type] }}
          >
            {start + i}
          </span>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="font-medium" style={{ color: TYPE_COLOR[s.type] }}>{TYPE_LABEL[s.type]}</span>
              <span>·</span>
              <span>{s.app}</span>
            </div>
            <p className="font-medium">{s.event}</p>
            {s.description && <p className="mt-1 text-sm text-muted">{s.description}</p>}
            {s.branches && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {s.branches.map((b) => (
                  <div key={b.name} className="rounded-lg border border-dashed border-border p-3">
                    <p className="mb-3 text-sm font-medium">
                      {b.name} <span className="font-normal text-muted">— {b.condition}</span>
                    </p>
                    <StepList steps={b.steps} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ZapierSteps({ steps }: { steps: ZapierStep[] }) {
  return <StepList steps={steps} />;
}
