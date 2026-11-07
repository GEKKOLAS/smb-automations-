import { Catalog } from "@/components/Catalog";
import { countSteps, getWorkflows } from "@/lib/workflows";

export default function Home() {
  const workflows = getWorkflows();
  const items = workflows.map((w) => ({ slug: w.slug, meta: w.meta, steps: countSteps(w), hasVideo: Boolean(w.video) }));
  const hours = workflows.reduce((a, w) => a + (w.meta.hoursSavedPerMonth ?? 0), 0);
  const n8n = workflows.filter((w) => w.meta.platform === "n8n").length;

  return (
    <>
      <section className="mb-10">
        <h1 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">Biblioteca de automatizaciones</h1>
        <p className="max-w-2xl text-muted">
          Flujos de trabajo de n8n y Zapier para pequeñas y medianas empresas: ventas, marketing, finanzas y
          atención al cliente. Cada flujo incluye su diagrama, los pasos para instalarlo y el archivo para importarlo.
        </p>
        <dl className="mt-6 flex flex-wrap gap-8 text-sm">
          <div><dt className="text-muted">Flujos</dt><dd className="text-2xl font-semibold">{workflows.length}</dd></div>
          <div><dt className="text-muted">n8n / Zapier</dt><dd className="text-2xl font-semibold">{n8n} / {workflows.length - n8n}</dd></div>
          <div><dt className="text-muted">Horas ahorradas al mes</dt><dd className="text-2xl font-semibold">~{hours}</dd></div>
        </dl>
      </section>
      <Catalog items={items} />
    </>
  );
}
