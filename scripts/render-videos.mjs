// Genera un video MP4 por flujo grabando la simulación de /demo/<slug> fotograma a fotograma.
//
//   npm run videos                         # todos los flujos
//   npm run videos -- captacion-leads-crm  # solo algunos
//   opciones: --fps 30  --theme dark|light  --scale 1.5 (1280×720 × escala)
//
// Requiere el sitio exportado en out/ (npm run build), Playwright con Chromium y ffmpeg
// (en el PATH o en la variable FFMPEG_PATH).
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "out");
const VIDEOS = path.join(ROOT, "public", "videos");
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args.splice(i, 2)[1];
};
const fps = Number(opt("fps", 30));
const theme = opt("theme", "dark");
const scale = Number(opt("scale", 1.5));
const only = args.filter((a) => !a.startsWith("--"));

if (!fs.existsSync(OUT)) {
  console.error("No existe out/. Ejecuta antes `npm run build`.");
  process.exit(1);
}

const slugs = fs
  .readdirSync(path.join(ROOT, "workflows"), { withFileTypes: true })
  .filter((d) => d.isDirectory() && (!only.length || only.includes(d.name)))
  .map((d) => d.name);

// Servidor estático mínimo para out/.
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".mp4": "video/mp4", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const clean = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/\/$/, "");
  const candidates = [clean, `${clean}.html`, path.join(clean, "index.html")].map((p) => path.join(OUT, p));
  const file = candidates.find((f) => f.startsWith(OUT) && fs.existsSync(f) && fs.statSync(f).isFile());
  if (!file) return res.writeHead(404).end();
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

function encoder(file) {
  const ff = spawn(FFMPEG, [
    "-y", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", file,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((resolve, reject) => {
    ff.on("error", (e) => reject(new Error(`No se pudo ejecutar ffmpeg (${e.message}). Instálalo o define FFMPEG_PATH.`)));
    ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg terminó con código ${code}`))));
  });
  const write = (buf) => (ff.stdin.write(buf) ? Promise.resolve() : new Promise((r) => ff.stdin.once("drain", r)));
  return { write, end: () => (ff.stdin.end(), done) };
}

fs.mkdirSync(VIDEOS, { recursive: true });
const browser = await chromium.launch();
try {
  for (const slug of slugs) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: scale, colorScheme: theme });
    await page.goto(`${base}/demo/${slug}?record`);
    await page.waitForFunction(() => window.__demo);
    const duration = await page.evaluate(() => window.__demo.duration);
    const frames = Math.ceil((duration / 1000) * fps);
    const mp4 = path.join(VIDEOS, `${slug}.mp4`);
    const enc = encoder(mp4);
    const started = Date.now();

    for (let i = 0; i <= frames; i++) {
      await page.evaluate((ms) => window.__demo.seek(ms), Math.min(duration, (i * 1000) / fps));
      await enc.write(await page.screenshot({ type: "jpeg", quality: 92 }));
      if (i % fps === 0) process.stdout.write(`\r${slug}: ${Math.round((i / frames) * 100)}%`);
    }
    await enc.end();

    // Portada del video: la intro con el título.
    await page.evaluate(() => window.__demo.seek(1000));
    await page.screenshot({ path: path.join(VIDEOS, `${slug}.jpg`), type: "jpeg", quality: 85 });
    await page.close();

    const mb = (fs.statSync(mp4).size / 1e6).toFixed(1);
    console.log(`\r✓ ${slug}.mp4 · ${(duration / 1000).toFixed(1)} s · ${mb} MB · ${((Date.now() - started) / 1000).toFixed(0)} s de render`);
  }
} finally {
  await browser.close();
  server.close();
}
