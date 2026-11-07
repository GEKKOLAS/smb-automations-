"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Platform, WorkflowMeta } from "@/lib/types";
import { PlatformBadge, StatusBadge } from "./PlatformBadge";

export interface CatalogItem {
  slug: string;
  meta: WorkflowMeta;
  steps: number;
  hasVideo: boolean;
}

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function Catalog({ items }: { items: CatalogItem[] }) {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => [...new Set(items.map((i) => i.meta.category))].sort(), [items]);

  const filtered = items.filter(({ meta }) => {
    if (platform !== "all" && meta.platform !== platform) return false;
    if (category !== "all" && meta.category !== category) return false;
    if (!query) return true;
    const hay = norm([meta.title, meta.summary, meta.trigger, meta.industry ?? "", ...meta.apps, ...meta.tags].join(" "));
    return norm(query).split(/\s+/).every((t) => hay.includes(t));
  });

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm transition ${
      active ? "border-text bg-text text-bg" : "border-border text-muted hover:text-text"
    }`;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por app, objetivo o etiqueta…"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-text sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {(["all", "n8n", "zapier"] as const).map((p) => (
            <button key={p} onClick={() => setPlatform(p)} className={chip(platform === p)}>
              {p === "all" ? "Todas" : p === "n8n" ? "n8n" : "Zapier"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setCategory("all")} className={chip(category === "all")}>Todas las áreas</button>
        {categories.map((c) => (
          <button key={c} onClick={() => setCategory(c)} className={chip(category === c)}>{c}</button>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted">
        {filtered.length} {filtered.length === 1 ? "flujo" : "flujos"}
      </p>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(({ slug, meta, steps, hasVideo }) => (
          <li key={slug}>
            <Link
              href={`/workflows/${slug}`}
              className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-text"
            >
              <div className="mb-3 flex items-center gap-2">
                <PlatformBadge platform={meta.platform} />
                <StatusBadge status={meta.status} />
                <span className="ml-auto text-xs text-muted">{meta.category}</span>
              </div>
              <h2 className="mb-2 font-semibold leading-snug">{meta.title}</h2>
              <p className="mb-4 text-sm text-muted">{meta.summary}</p>
              <div className="mt-auto flex flex-wrap gap-1.5">
                {meta.apps.map((a) => (
                  <span key={a} className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">{a}</span>
                ))}
              </div>
              <div className="mt-4 flex justify-between border-t border-border pt-3 text-xs text-muted">
                <span>{steps} pasos{hasVideo ? " · ▶ video" : ""}</span>
                {meta.hoursSavedPerMonth ? <span>~{meta.hoursSavedPerMonth} h/mes ahorradas</span> : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">
          Ningún flujo coincide con la búsqueda.
        </p>
      )}
    </div>
  );
}
