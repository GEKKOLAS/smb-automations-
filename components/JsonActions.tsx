"use client";

import { useState } from "react";

export function JsonActions({ raw, fileName, downloadName }: { raw: string; fileName: string; downloadName: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* el portapapeles puede no estar disponible (http, iframe) */
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={download} className="rounded-lg bg-text px-4 py-2 text-sm font-medium text-bg hover:opacity-90">
        Descargar {fileName}
      </button>
      <button onClick={copy} className="rounded-lg border border-border px-4 py-2 text-sm hover:border-text">
        {copied ? "¡Copiado!" : "Copiar JSON"}
      </button>
    </div>
  );
}
