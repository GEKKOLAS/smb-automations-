import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMB Automations",
  description: "Biblioteca de flujos de automatización con n8n y Zapier para pequeñas y medianas empresas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen font-sans antialiased">
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
      </body>
    </html>
  );
}
