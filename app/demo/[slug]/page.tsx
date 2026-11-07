import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DemoPlayer } from "@/components/DemoPlayer";
import { workflowGraph } from "@/lib/graph";
import { getWorkflow, getWorkflows } from "@/lib/workflows";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getWorkflows().map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const w = getWorkflow((await params).slug);
  return w ? { title: `Demo · ${w.meta.title}` } : {};
}

/** Simulación a pantalla completa. Con ?record la usa el generador de videos. */
export default async function DemoPage({ params }: Params) {
  const w = getWorkflow((await params).slug);
  if (!w) notFound();
  return (
    <DemoPlayer
      variant="page"
      graph={workflowGraph(w)}
      script={w.demo}
      title={w.meta.title}
      platform={w.meta.platform}
      apps={w.meta.apps}
      hoursSavedPerMonth={w.meta.hoursSavedPerMonth}
    />
  );
}
