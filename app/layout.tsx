import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMB Automations",
  description: "Biblioteca de flujos de automatización con n8n y Zapier para pequeñas y medianas empresas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
