import Link from "next/link";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-text text-bg text-sm">⚡</span>
            SMB Automations
          </Link>
          <nav className="text-sm text-muted">
            <Link href="/" className="hover:text-text">Biblioteca</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-muted">
        Flujos de n8n y Zapier documentados para reutilizar en otros clientes.
      </footer>
    </>
  );
}
