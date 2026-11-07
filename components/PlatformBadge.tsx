import type { Platform, Status } from "@/lib/types";

export function PlatformBadge({ platform }: { platform: Platform }) {
  const cls = platform === "n8n" ? "bg-n8n/10 text-n8n" : "bg-zapier/10 text-zapier";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {platform === "n8n" ? "n8n" : "Zapier"}
    </span>
  );
}

const STATUS_LABEL: Record<Status, string> = {
  produccion: "En producción",
  piloto: "Piloto",
  plantilla: "Plantilla",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
      {STATUS_LABEL[status]}
    </span>
  );
}
