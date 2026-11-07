import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonActions } from "@/components/JsonActions";
import { N8nDiagram } from "@/components/N8nDiagram";
import { PlatformBadge, StatusBadge } from "@/components/PlatformBadge";
import { ZapierSteps } from "@/components/ZapierSteps";
import type { N8nWorkflow, ZapierWorkflow } from "@/lib/types";
import { countSteps, getWorkflow, getWorkflows } from "@/lib/workflows";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getWorkflows().map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const w = getWorkflow((await params).slug);
  return w ? { title: `${w.meta.title} · SMB Automations`, description: w.meta.summary } : {};
}

export default async function WorkflowPage({ params }: Params) {
  const w = getWorkflow((await params).slug);
  if (!w) notFound();
  const { meta } = w;

  return (
    <article>
      <Link href="/" className="mb-6 inline-block text-sm text-muted hover:text-text">← Volver a la biblioteca</Link>

      <header className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <PlatformBadge platform={meta.platform} />
          <StatusBadge status={meta.status} />
          <span className="text-xs text-muted">{meta.category}{meta.industry ? ` · ${meta.industry}` : ""}</span>
        </div>
        <h1 className="mb-3 text-2xl font-semibold tracking-tight sm:text-3xl">{meta.title}</h1>
        <p className="max-w-3xl text-muted">{meta.description}</p>
      </header>

      <dl className="mb-10 grid grid-cols-2 gap-4 rounded-xl border border-border bg-surface p-5 text-sm sm:grid-cols-4">
        <div><dt className="text-muted">Disparador</dt><dd className="font-medium">{meta.trigger}</dd></div>
        <div><dt className="text-muted">Pasos</dt><dd className="font-medium">{countSteps(w)}</dd></div>
        <div><dt className="text-muted">Ahorro estimado</dt><dd className="font-medium">{meta.hoursSavedPerMonth ? `~${meta.hoursSavedPerMonth} h/mes` : "—"}</dd></div>
        <div><dt className="text-muted">Actualizado</dt><dd className="font-medium">{meta.updated}</dd></div>
      </dl>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Flujo</h2>
        {meta.platform === "n8n" ? (
          <N8nDiagram workflow={w.definition as N8nWorkflow} />
        ) : (
          <ZapierSteps steps={(w.definition as ZapierWorkflow).steps} />
        )}
      </section>

      <div className="mb-10 grid gap-6 md:grid-cols-2">
        {meta.setup?.length ? (
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 font-semibold">Cómo instalarlo</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              {meta.setup.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </section>
        ) : null}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 font-semibold">Apps y credenciales</h2>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {meta.apps.map((a) => <span key={a} className="rounded bg-surface-2 px-2 py-0.5 text-xs">{a}</span>)}
          </div>
          {meta.credentials?.length ? (
            <ul className="space-y-1 text-sm text-muted">
              {meta.credentials.map((c) => <li key={c}>🔑 {c}</li>)}
            </ul>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {meta.tags.map((t) => <span key={t} className="text-xs text-muted">#{t}</span>)}
          </div>
        </section>
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {meta.platform === "n8n" ? "Archivo para importar en n8n" : "Definición del Zap"}
          </h2>
          <JsonActions raw={w.raw} fileName={w.fileName} downloadName={`${w.slug}.${w.fileName}`} />
        </div>
        <pre className="max-h-[420px] overflow-auto rounded-xl border border-border bg-surface p-4 font-mono text-xs leading-relaxed">
          {w.raw}
        </pre>
      </section>
    </article>
  );
}
